import connectDB from '../_lib/db.js';
import GameSettings from '../../server/models/GameSettings.js';
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

  try {
    await connectDB();
    
    if (req.method === 'GET') {
      const settings = await GameSettings.getSettings();
      res.json(settings);
    } else if (req.method === 'PUT') {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      const adminCheck = isAdmin(authResult.user);
      if (adminCheck.error) {
        return res.status(adminCheck.error.status).json({ message: adminCheck.error.message });
      }

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
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Game settings error:', error);
    res.status(500).json({ message: error.message });
  }
}

