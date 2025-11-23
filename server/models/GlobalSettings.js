import mongoose from 'mongoose';

const globalSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'Kacha Taka'
  },
  minimumDepositBDT: {
    type: Number,
    default: 100
  },
  minimumDepositPoints: {
    type: Number,
    default: 500
  },
  minimumWithdrawalPoints: {
    type: Number,
    default: 2500
  },
  minimumWithdrawalBDT: {
    type: Number,
    default: 500
  },
  referralBonusPoints: {
    type: Number,
    default: 50
  },
  conversionRate: {
    type: Number,
    default: 5
  },
  initialDemoPoints: {
    type: Number,
    default: 100
  }
}, {
  timestamps: true
});

// Ensure only one document exists
globalSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

export default GlobalSettings;

