import connectDB from '../_lib/db.js';
import Transaction from '../../server/models/Transaction.js';
import { authenticate } from '../_lib/auth.js';

export default async function transactionsRoutes(req, res, pathname) {
  await connectDB();

  if (pathname === '/transactions') {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      if (req.method === 'POST') {
        const transaction = await Transaction.create({
          ...req.body,
          userId: authResult.user._id
        });
        return res.status(201).json(transaction);
      } else if (req.method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const status = url.searchParams.get('status');
        
        const query = { userId: authResult.user._id };
        if (status) query.status = status;

        const transactions = await Transaction.find(query)
          .sort({ createdAt: -1 })
          .populate('userId', 'name email');

        return res.json(transactions);
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}

