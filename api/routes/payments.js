import connectDB from '../_lib/db.js';
import PaymentRequest from '../../server/models/PaymentRequest.js';
import User from '../../server/models/User.js';
import Transaction from '../../server/models/Transaction.js';
import { authenticate, isAdmin } from '../_lib/auth.js';

export default async function paymentsRoutes(req, res, pathname) {
  await connectDB();

  // Get all payments or create payment request
  if (pathname === '/payments') {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      if (req.method === 'POST') {
        const paymentRequest = await PaymentRequest.create({
          ...req.body,
          userId: authResult.user._id,
          userName: authResult.user.name
        });
        return res.status(201).json(paymentRequest);
      } else if (req.method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const status = url.searchParams.get('status');
        
        const query = authResult.user.isAdmin ? {} : { userId: authResult.user._id };
        if (status) query.status = status;

        const requests = await PaymentRequest.find(query)
          .sort({ createdAt: -1 })
          .populate('userId', 'name email');

        return res.json(requests);
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Update or delete payment request (Admin only)
  if (pathname.match(/^\/payments\/[^/]+$/)) {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      const adminCheck = isAdmin(authResult.user);
      if (adminCheck.error) {
        return res.status(adminCheck.error.status).json({ message: adminCheck.error.message });
      }

      const id = pathname.split('/payments/')[1];

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
              if (user.realBalance < request.amount) {
                request.status = 'rejected';
                await request.save();
                return res.status(400).json({ message: 'Insufficient balance for withdrawal' });
              }
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

        return res.json(request);
      } else if (req.method === 'DELETE') {
        const request = await PaymentRequest.findById(id);
        if (!request) {
          return res.status(404).json({ message: 'Payment request not found' });
        }

        await PaymentRequest.findByIdAndDelete(id);
        return res.json({ message: 'Payment request deleted successfully' });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}

