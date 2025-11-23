import connectDB from '../_lib/db.js';
import Transaction from '../../server/models/Transaction.js';
import { authenticate } from '../_lib/auth.js';
import { corsHeaders } from '../_lib/cors.js';

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

    if (req.method === 'POST') {
      const transaction = await Transaction.create({
        ...req.body,
        userId: authResult.user._id
      });
      res.status(201).json(transaction);
    } else if (req.method === 'GET') {
      const query = { userId: authResult.user._id };
      if (req.query.status) query.status = req.query.status;

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .populate('userId', 'name email');

      res.json(transactions);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

