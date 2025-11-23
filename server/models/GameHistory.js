import mongoose from 'mongoose';

const gameHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game: {
    type: String,
    enum: ['crash', 'mines', 'slots', 'dice'],
    required: true
  },
  roundId: {
    type: String,
    required: true
  },
  betAmount: {
    type: Number,
    required: true
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  winAmount: {
    type: Number,
    default: 0
  },
  multiplier: {
    type: Number,
    default: 0
  },
  serverSeed: {
    type: String,
    required: true
  },
  seedHash: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
gameHistorySchema.index({ userId: 1, createdAt: -1 });
gameHistorySchema.index({ game: 1, createdAt: -1 });

const GameHistory = mongoose.model('GameHistory', gameHistorySchema);

export default GameHistory;

