import connectDB from '../../_lib/db.js';
import User from '../../../server/models/User.js';
import { authenticate } from '../../_lib/auth.js';
import { corsHeaders } from '../../_lib/cors.js';

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

    const { id } = req.query;
    const referrals = await User.find({ referredBy: id }).select('-password');
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

