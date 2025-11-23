import express from 'express';
import Message from '../models/Message.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Add message
router.post('/', authenticate, async (req, res) => {
  try {
    const message = await Message.create({
      ...req.body,
      userId: req.user._id,
      userName: req.user.name
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages
router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.user.isAdmin ? {} : { userId: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update message (Admin only for replies)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Users can only update their own messages, admins can update any
    if (message.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only admins can add replies
    if (req.body.reply && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can reply' });
    }

    Object.assign(message, req.body);
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

