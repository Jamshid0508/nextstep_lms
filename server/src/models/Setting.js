import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    organizationName: { type: String, default: "Next Step O'quv Markazi" },
    logo: { type: String },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
    timezone: { type: String, default: 'Asia/Tashkent' },
    currency: { type: String, default: 'UZS' },
  },
  { timestamps: true },
);

export const Setting = mongoose.model('Setting', settingSchema);
