import connectDB from '../_lib/db.js';
import PlatformStats from '../../server/models/PlatformStats.js';
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
      const stats = await PlatformStats.getStats();
      res.json(stats);
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
      res.json(stats);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

