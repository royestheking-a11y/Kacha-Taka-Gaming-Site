import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  reply: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'replied', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ status: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

