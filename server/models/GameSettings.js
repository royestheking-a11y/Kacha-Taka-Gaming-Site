import mongoose from 'mongoose';

const gameSettingsSchema = new mongoose.Schema({
  crash: {
    enabled: { type: Boolean, default: true },
    minBet: { type: Number, default: 10 },
    maxBet: { type: Number, default: 10000 },
    houseFactor: { type: Number, default: 0.97 }
  },
  mines: {
    enabled: { type: Boolean, default: true },
    minBet: { type: Number, default: 10 },
    maxBet: { type: Number, default: 10000 },
    minMines: { type: Number, default: 1 },
    maxMines: { type: Number, default: 24 }
  },
  slots: {
    enabled: { type: Boolean, default: true },
    minBet: { type: Number, default: 10 },
    maxBet: { type: Number, default: 10000 },
    rtp: { type: Number, default: 0.95 }
  },
  dice: {
    enabled: { type: Boolean, default: true },
    minBet: { type: Number, default: 10 },
    maxBet: { type: Number, default: 10000 },
    houseEdge: { type: Number, default: 0.02 }
  }
}, {
  timestamps: true
});

// Ensure only one document exists
gameSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const GameSettings = mongoose.model('GameSettings', gameSettingsSchema);

export default GameSettings;

