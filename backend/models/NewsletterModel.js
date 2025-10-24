import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  source: {
    type: String,
    default: 'website'
  },
  preferences: {
    promotions: { type: Boolean, default: true },
    skincareTips: { type: Boolean, default: true },
    newProducts: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Index for faster queries
newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ isActive: 1 });
newsletterSchema.index({ subscribedAt: -1 });

export default mongoose.model('Newsletter', newsletterSchema);