import express from 'express';
import Transaction from '../models/Transaction.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Add transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const query = { userId: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

