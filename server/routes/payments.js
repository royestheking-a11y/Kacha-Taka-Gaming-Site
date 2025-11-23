import express from 'express';
import PaymentRequest from '../models/PaymentRequest.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Add payment request
router.post('/', authenticate, async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.create({
      ...req.body,
      userId: req.user._id,
      userName: req.user.name
    });
    res.status(201).json(paymentRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment requests
router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.user.isAdmin ? {} : { userId: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const requests = await PaymentRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment request (Admin only)
router.patch('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const request = await PaymentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    const oldStatus = request.status;
    Object.assign(request, req.body);
    await request.save();

    // If approved, update user balance and create transaction
    if (request.status === 'approved' && oldStatus !== 'approved') {
      const user = await User.findById(request.userId);
      if (user) {
        if (request.type === 'deposit') {
          // Add points to real balance
          user.realBalance += request.amount;
          await Transaction.create({
            userId: user._id,
            type: 'deposit',
            amount: request.amount,
            status: 'completed',
            method: request.method,
            details: `Deposit via ${request.method} - ${request.transactionId || ''}`
          });
        } else if (request.type === 'withdraw') {
          // Check if user has enough balance before deducting
          if (user.realBalance < request.amount) {
            // Reject if insufficient balance
            request.status = 'rejected';
            await request.save();
            return res.status(400).json({ message: 'Insufficient balance for withdrawal' });
          }
          // Deduct points from real balance
          user.realBalance -= request.amount;
          await Transaction.create({
            userId: user._id,
            type: 'withdraw',
            amount: request.amount,
            status: 'completed',
            method: request.method,
            details: `Withdrawal via ${request.method} to ${request.accountDetails || ''}`
          });
        }
        await user.save();
      }
    }
    
    // If rejected and was a withdrawal, refund the balance (if it was already deducted)
    if (request.status === 'rejected' && oldStatus === 'pending' && request.type === 'withdraw') {
      const user = await User.findById(request.userId);
      if (user) {
        // Only refund if balance seems incorrect (this handles edge cases)
        // Note: With current flow, withdrawal balance is only deducted on approval,
        // so rejection doesn't need refund. But keeping this for safety.
        await Transaction.create({
          userId: user._id,
          type: 'withdraw',
          amount: request.amount,
          status: 'rejected',
          method: request.method,
          details: 'Withdrawal rejected'
        });
      }
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete payment request (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const request = await PaymentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    await PaymentRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

