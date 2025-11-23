import connectDB from '../../_lib/db.js';
import User from '../../../server/models/User.js';
import { authenticate, isAdmin } from '../../_lib/auth.js';
import { corsHeaders } from '../../_lib/cors.js';

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'PATCH') {
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

    const { id } = req.query;
    const { demoPoints, realBalance } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (demoPoints !== undefined) user.demoPoints = demoPoints;
    if (realBalance !== undefined) user.realBalance = realBalance;

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

