import connectDB from '../_lib/db.js';
import User from '../../server/models/User.js';
import jwt from 'jsonwebtoken';
import { corsHeaders } from '../_lib/cors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kachataka-super-secret-jwt-key-2024';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
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
}

