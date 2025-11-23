import connectDB from '../../_lib/db.js';
import Message from '../../../server/models/Message.js';
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

    const { id } = req.query;
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Users can only update their own messages, admins can update any
    if (message.userId.toString() !== authResult.user._id.toString() && !authResult.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only admins can add replies
    if (req.body.reply && !authResult.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can reply' });
    }

    Object.assign(message, req.body);
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

