import express from 'express';
import GameHistory from '../models/GameHistory.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Add game history
router.post('/history', authenticate, async (req, res) => {
  try {
    const gameHistory = await GameHistory.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(gameHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get game history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { game, limit = 100 } = req.query;
    const query = { userId: req.user._id };
    if (game) query.game = game;

    const history = await GameHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get game statistics (Admin only)
router.get('/stats', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
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
});

export default router;

