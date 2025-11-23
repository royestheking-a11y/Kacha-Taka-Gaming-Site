import connectDB from '../_lib/db.js';
import GameHistory from '../../server/models/GameHistory.js';
import { authenticate, isAdmin } from '../_lib/auth.js';
import { corsHeaders } from '../_lib/cors.js';

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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

    const stats = {
      crash: {
        totalBets: await GameHistory.countDocuments({ game: 'crash' }),
        totalWagered: await GameHistory.aggregate([
          { $match: { game: 'crash' } },
          { $group: { _id: null, total: { $sum: '$betAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalWon: await GameHistory.aggregate([
          { $match: { game: 'crash' } },
          { $group: { _id: null, total: { $sum: '$winAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalPlayers: await GameHistory.distinct('userId', { game: 'crash' }).then(r => r.length)
      },
      mines: {
        totalBets: await GameHistory.countDocuments({ game: 'mines' }),
        totalWagered: await GameHistory.aggregate([
          { $match: { game: 'mines' } },
          { $group: { _id: null, total: { $sum: '$betAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalWon: await GameHistory.aggregate([
          { $match: { game: 'mines' } },
          { $group: { _id: null, total: { $sum: '$winAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalPlayers: await GameHistory.distinct('userId', { game: 'mines' }).then(r => r.length)
      },
      slots: {
        totalBets: await GameHistory.countDocuments({ game: 'slots' }),
        totalWagered: await GameHistory.aggregate([
          { $match: { game: 'slots' } },
          { $group: { _id: null, total: { $sum: '$betAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalWon: await GameHistory.aggregate([
          { $match: { game: 'slots' } },
          { $group: { _id: null, total: { $sum: '$winAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalPlayers: await GameHistory.distinct('userId', { game: 'slots' }).then(r => r.length)
      },
      dice: {
        totalBets: await GameHistory.countDocuments({ game: 'dice' }),
        totalWagered: await GameHistory.aggregate([
          { $match: { game: 'dice' } },
          { $group: { _id: null, total: { $sum: '$betAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalWon: await GameHistory.aggregate([
          { $match: { game: 'dice' } },
          { $group: { _id: null, total: { $sum: '$winAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalPlayers: await GameHistory.distinct('userId', { game: 'dice' }).then(r => r.length)
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

