import mongoose from 'mongoose';

const platformStatsSchema = new mongoose.Schema({
  baseActiveUsers: {
    type: Number,
    default: 5000
  },
  baseDailyWithdrawals: {
    type: Number,
    default: 500000
  },
  baseTotalWithdrawn: {
    type: Number,
    default: 2000000
  },
  baseGamesPlayed: {
    type: Number,
    default: 35000
  },
  baseRecentWithdrawals: {
    type: Number,
    default: 50000
  },
  actualWithdrawals: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure only one document exists
platformStatsSchema.statics.getStats = async function() {
  let stats = await this.findOne();
  if (!stats) {
    stats = await this.create({});
  }
  return stats;
};

const PlatformStats = mongoose.model('PlatformStats', platformStatsSchema);

export default PlatformStats;

