import connectDB from '../_lib/db.js';
import User from '../../server/models/User.js';
import { authenticate } from '../_lib/auth.js';
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
    
    const authResult = await authenticate(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const { id } = req.query;

    if (req.method === 'GET') {
      const user = await User.findById(id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } else if (req.method === 'PUT') {
      // Users can only update themselves unless admin
      if (id !== authResult.user._id.toString() && !authResult.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Allow users to update their own balance (demoPoints, realBalance)
      // Admins can update any field
      if (authResult.user.isAdmin) {
        Object.assign(user, req.body);
      } else {
        // Regular users can only update balance fields
        if (req.body.demoPoints !== undefined) user.demoPoints = req.body.demoPoints;
        if (req.body.realBalance !== undefined) user.realBalance = req.body.realBalance;
        // Allow other non-sensitive fields
        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.phone !== undefined) user.phone = req.body.phone;
      }

      await user.save();
      res.json(user.toJSON());
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

