import connectDB from '../_lib/db.js';
import GlobalSettings from '../../server/models/GlobalSettings.js';
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
      const settings = await GlobalSettings.getSettings();
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

      let settings = await GlobalSettings.findOne();
      if (!settings) {
        settings = await GlobalSettings.create(req.body);
      } else {
        Object.assign(settings, req.body);
        await settings.save();
      }
      res.json(settings);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

