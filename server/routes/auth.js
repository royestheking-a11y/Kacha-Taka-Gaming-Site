import express from 'express';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kachataka-super-secret-jwt-key-2024';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userData = {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password
    };

    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        userData.referredBy = referrer._id;
      }
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

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    // Check if user exists for password reset
    if (purpose === 'password-reset') {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove old OTPs
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose 
    });

    // Store new OTP
    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      purpose,
      expiresAt
    });

    console.log(`[OTP] Generated for ${email}: ${otpCode} (${purpose})`);

    res.json({ 
      message: 'OTP sent successfully',
      success: true,
      otp: otpCode // Return OTP so frontend can send email
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code, purpose } = req.body;

    const otp = await OTP.findOne({
      email: email.toLowerCase(),
      purpose,
      code: code.trim(),
      expiresAt: { $gt: new Date() }
    });

    if (!otp) {
      return res.status(400).json({ 
        valid: false,
        message: 'Invalid or expired OTP' 
      });
    }

    // Increment attempts
    otp.attempts += 1;
    if (otp.attempts >= 5) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(400).json({ 
        valid: false,
        message: 'Too many attempts. Please request a new OTP.' 
      });
    }

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otp._id });

    res.json({ 
      valid: true,
      message: 'OTP verified successfully' 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      valid: false,
      message: error.message || 'OTP verification failed' 
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Failed to reset password' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;

