import connectDB from '../../_lib/db.js';
import PaymentRequest from '../../../server/models/PaymentRequest.js';
import User from '../../../server/models/User.js';
import Transaction from '../../../server/models/Transaction.js';
import { authenticate, isAdmin } from '../../_lib/auth.js';
import { corsHeaders } from '../../_lib/cors.js';

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    await connectDB();
    
    const authResult = await authenticate(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const adminCheck = isAdmin(authResult.user);
    if (adminCheck.error) {
      return res.status(adminCheck.error.status).json({ message: adminCheck.error.message });
    }

    const { id } = req.query;

    if (req.method === 'PATCH') {
      const request = await PaymentRequest.findById(id);
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
    } else if (req.method === 'DELETE') {
      const request = await PaymentRequest.findById(id);
      if (!request) {
        return res.status(404).json({ message: 'Payment request not found' });
      }

      await PaymentRequest.findByIdAndDelete(id);
      res.json({ message: 'Payment request deleted successfully' });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

