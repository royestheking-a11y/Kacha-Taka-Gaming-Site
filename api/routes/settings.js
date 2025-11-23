import connectDB from '../_lib/db.js';
import GameSettings from '../../server/models/GameSettings.js';
import GlobalSettings from '../../server/models/GlobalSettings.js';
import PlatformStats from '../../server/models/PlatformStats.js';
import { authenticate, isAdmin } from '../_lib/auth.js';

export default async function settingsRoutes(req, res, pathname) {
  try {
    await connectDB();
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    return res.status(500).json({ 
      message: 'Database connection failed', 
      error: dbError.message 
    });
  }

  // Game settings
  if (pathname === '/settings/game' || pathname.startsWith('/settings/game/')) {
    try {
      if (req.method === 'GET') {
        const settings = await GameSettings.getSettings();
        return res.json(settings.toJSON());
      } else if (req.method === 'PUT') {
        const authResult = await authenticate(req);
        if (authResult.error) {
          return res.status(authResult.error.status).json({ message: authResult.error.message });
        }

        const adminCheck = isAdmin(authResult.user);
        if (adminCheck.error) {
          return res.status(adminCheck.error.status).json({ message: adminCheck.error.message });
        }

        const { crash, mines, slots, dice } = req.body;
        const updateData = { crash, mines, slots, dice };
        
        let settings = await GameSettings.findOne();
        if (!settings) {
          settings = await GameSettings.create(updateData);
        } else {
          if (crash) settings.crash = crash;
          if (mines) settings.mines = mines;
          if (slots) settings.slots = slots;
          if (dice) settings.dice = dice;
          await settings.save();
        }
        return res.json(settings.toJSON ? settings.toJSON() : settings);
      }
    } catch (error) {
      console.error('Game settings error:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  // Global settings
  if (pathname === '/settings/global' || pathname.startsWith('/settings/global/')) {
    try {
      if (req.method === 'GET') {
        const settings = await GlobalSettings.getSettings();
        return res.json(settings.toJSON());
      } else if (req.method === 'PUT') {
        const authResult = await authenticate(req);
        if (authResult.error) {
          return res.status(authResult.error.status).json({ message: authResult.error.message });
        }

        const adminCheck = isAdmin(authResult.user);
        if (adminCheck.error) {
          return res.status(adminCheck.error.status).json({ message: adminCheck.error.message });
        }

        let settings = await GlobalSettings.findOne();
        if (!settings) {
          settings = await GlobalSettings.create(req.body);
        } else {
          Object.assign(settings, req.body);
          await settings.save();
        }
        return res.json(settings.toJSON ? settings.toJSON() : settings);
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Platform stats
  if (pathname === '/settings/stats' || pathname.startsWith('/settings/stats/')) {
    try {
      if (req.method === 'GET') {
        const stats = await PlatformStats.getStats();
        return res.json(stats.toJSON());
      } else if (req.method === 'PUT') {
        const authResult = await authenticate(req);
        if (authResult.error) {
          return res.status(authResult.error.status).json({ message: authResult.error.message });
        }

        const adminCheck = isAdmin(authResult.user);
        if (adminCheck.error) {
          return res.status(adminCheck.error.status).json({ message: adminCheck.error.message });
        }

        let stats = await PlatformStats.findOne();
        if (!stats) {
          stats = await PlatformStats.create(req.body);
        } else {
          Object.assign(stats, req.body);
          await stats.save();
        }
        return res.json(stats.toJSON());
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}

