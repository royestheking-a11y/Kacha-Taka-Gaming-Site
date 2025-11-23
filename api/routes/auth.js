import connectDB from '../_lib/db.js';
import User from '../../server/models/User.js';
import OTP from '../../server/models/OTP.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kachataka-super-secret-jwt-key-2024';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

export default async function authRoutes(req, res, pathname) {
  await connectDB();

  // Register
  if (pathname === '/auth/register' && req.method === 'POST') {
    try {
      const { name, email, phone, password, referralCode } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const userData = { name, email: email.toLowerCase(), phone: phone || '', password };
      if (referralCode) {
        const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        if (referrer) userData.referredBy = referrer._id;
      }

      const user = await User.create(userData);
      user.referralCode = user.generateReferralCode();
      await user.save();

      if (user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          referrer.referralEarnings += 500;
          referrer.demoPoints += 500;
          await referrer.save();
        }
      }

      const token = generateToken(user._id);
      return res.status(201).json({ message: 'Registration successful', token, user: user.toJSON() });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ message: error.message || 'Registration failed' });
    }
  }

  // Login
  if (pathname === '/auth/login' && req.method === 'POST') {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      let user = await User.findOne({ email: email.toLowerCase() });
      
      // Auto-initialize admin if trying to login with admin credentials and user doesn't exist
      if (!user && email.toLowerCase() === 'admin@kachataka.com' && password === 'kachataka') {
        console.log('Auto-initializing admin user...');
        const { initializeAdmin } = await import('../_lib/init.js');
        user = await initializeAdmin();
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = generateToken(user._id);
      return res.json({ message: 'Login successful', token, user: user.toJSON() });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: error.message || 'Login failed' });
    }
  }

  // Get current user
  if (pathname === '/auth/me' && req.method === 'GET') {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ user: user.toJSON() });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  // Send OTP
  if (pathname === '/auth/send-otp' && req.method === 'POST') {
    try {
      const { email, purpose } = req.body;

      if (purpose === 'password-reset') {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return res.status(404).json({ message: 'Email not found' });
        }
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await OTP.deleteMany({ email: email.toLowerCase(), purpose });
      await OTP.create({ email: email.toLowerCase(), code: otpCode, purpose, expiresAt });

      console.log(`[OTP] Generated for ${email}: ${otpCode} (${purpose})`);
      return res.json({ message: 'OTP sent successfully', success: true, otp: otpCode });
    } catch (error) {
      console.error('Send OTP error:', error);
      return res.status(500).json({ message: error.message || 'Failed to send OTP' });
    }
  }

  // Verify OTP
  if (pathname === '/auth/verify-otp' && req.method === 'POST') {
    try {
      const { email, code, purpose } = req.body;

      const otp = await OTP.findOne({
        email: email.toLowerCase(),
        purpose,
        code: code.trim(),
        expiresAt: { $gt: new Date() }
      });

      if (!otp) {
        return res.status(400).json({ valid: false, message: 'Invalid or expired OTP' });
      }

      otp.attempts += 1;
      if (otp.attempts >= 5) {
        await OTP.deleteOne({ _id: otp._id });
        return res.status(400).json({ valid: false, message: 'Too many attempts. Please request a new OTP.' });
      }

      await OTP.deleteOne({ _id: otp._id });
      return res.json({ valid: true, message: 'OTP verified successfully' });
    } catch (error) {
      console.error('Verify OTP error:', error);
      return res.status(500).json({ valid: false, message: error.message || 'OTP verification failed' });
    }
  }

  // Reset password
  if (pathname === '/auth/reset-password' && req.method === 'POST') {
    try {
      const { email, newPassword } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.password = newPassword;
      await user.save();
      return res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ message: error.message || 'Failed to reset password' });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}

