import connectDB from '../_lib/db.js';
import GameHistory from '../../server/models/GameHistory.js';
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
      const gameHistory = await GameHistory.create({
        ...req.body,
        userId: authResult.user._id
      });
      res.status(201).json(gameHistory);
    } else if (req.method === 'GET') {
      const { game, limit = 100 } = req.query;
      const query = { userId: authResult.user._id };
      if (game) query.game = game;

      const history = await GameHistory.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('userId', 'name email');

      res.json(history);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

