import express from 'express';
import GameSettings from '../models/GameSettings.js';
import GlobalSettings from '../models/GlobalSettings.js';
import PlatformStats from '../models/PlatformStats.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Game Settings
router.get('/game', async (req, res) => {
  try {
    const settings = await GameSettings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/game', authenticate, isAdmin, async (req, res) => {
  try {
    // Clean the request body - only allow game settings fields
    const { crash, mines, slots, dice } = req.body;
    const updateData = { crash, mines, slots, dice };
    
    let settings = await GameSettings.findOne();
    if (!settings) {
      settings = await GameSettings.create(updateData);
    } else {
      // Only update the game settings fields
      if (crash) settings.crash = crash;
      if (mines) settings.mines = mines;
      if (slots) settings.slots = slots;
      if (dice) settings.dice = dice;
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    console.error('Update game settings error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Global Settings
router.get('/global', async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/global', authenticate, isAdmin, async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Platform Stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await PlatformStats.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    let stats = await PlatformStats.findOne();
    if (!stats) {
      stats = await PlatformStats.create(req.body);
    } else {
      Object.assign(stats, req.body);
      await stats.save();
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

