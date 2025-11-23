import express from 'express';
import User from '../models/User.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Users can only update themselves unless admin
    if (req.params.id !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow users to update their own balance (demoPoints, realBalance)
    // Admins can update any field
    if (req.user.isAdmin) {
      Object.assign(user, req.body);
    } else {
      // Regular users can only update balance fields
      if (req.body.demoPoints !== undefined) user.demoPoints = req.body.demoPoints;
      if (req.body.realBalance !== undefined) user.realBalance = req.body.realBalance;
      // Allow other non-sensitive fields
      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.phone !== undefined) user.phone = req.body.phone;
    }

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user balance (Admin only)
router.patch('/:id/balance', authenticate, isAdmin, async (req, res) => {
  try {
    const { demoPoints, realBalance } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (demoPoints !== undefined) user.demoPoints = demoPoints;
    if (realBalance !== undefined) user.realBalance = realBalance;

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by referral code
router.get('/referral/:code', async (req, res) => {
  try {
    const user = await User.findOne({ referralCode: req.params.code.toUpperCase() }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get referrals
router.get('/:id/referrals', authenticate, async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.params.id }).select('-password');
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

