import connectDB from '../_lib/db.js';
import Message from '../../server/models/Message.js';
import { authenticate, isAdmin } from '../_lib/auth.js';

export default async function messagesRoutes(req, res, pathname) {
  await connectDB();

  // Get all messages or create message
  if (pathname === '/messages') {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      if (req.method === 'POST') {
        const message = await Message.create({
          ...req.body,
          userId: authResult.user._id,
          userName: authResult.user.name
        });
        return res.status(201).json(message.toJSON());
      } else if (req.method === 'GET') {
        const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
        const status = urlParams.get('status');
        
        const query = authResult.user.isAdmin ? {} : { userId: authResult.user._id };
        if (status) query.status = status;

        const messages = await Message.find(query)
          .sort({ createdAt: -1 })
          .populate('userId', 'name email');

        return res.json(messages.map(m => m.toJSON()));
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Update message
  if (pathname.match(/^\/messages\/[^/]+$/) && req.method === 'PATCH') {
    try {
      const authResult = await authenticate(req);
      if (authResult.error) {
        return res.status(authResult.error.status).json({ message: authResult.error.message });
      }

      const id = pathname.split('/messages/')[1];
      const message = await Message.findById(id);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      if (message.userId.toString() !== authResult.user._id.toString() && !authResult.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (req.body.reply && !authResult.user.isAdmin) {
        return res.status(403).json({ message: 'Only admins can reply' });
      }

      Object.assign(message, req.body);
      await message.save();

      return res.json(message.toJSON());
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}

