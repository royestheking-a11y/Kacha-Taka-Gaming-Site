import connectDB from '../_lib/db.js';
import GameHistory from '../../server/models/GameHistory.js';
import { authenticate, isAdmin } from '../_lib/auth.js';

export default async function gamesRoutes(req, res, pathname) {
  await connectDB();

  // Game history
  if (pathname === '/games/history') {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      if (req.method === 'POST') {
        const gameHistory = await GameHistory.create({
          ...req.body,
          userId: authResult.user._id
        });
        return res.status(201).json(gameHistory);
      } else if (req.method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const game = url.searchParams.get('game');
        const limit = parseInt(url.searchParams.get('limit') || '100');
        
        const query = { userId: authResult.user._id };
        if (game) query.game = game;

        const history = await GameHistory.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate('userId', 'name email');

        return res.json(history);
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Game stats (Admin only)
  if (pathname === '/games/stats' && req.method === 'GET') {
    try {
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

      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}

