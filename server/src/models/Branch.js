import mongoose from 'mongoose';
import { BRANCH_STATUS } from '../constants/status.js';

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(BRANCH_STATUS),
      default: BRANCH_STATUS.ACTIVE,
    },
  },
  { timestamps: true },
);

export const Branch = mongoose.model('Branch', branchSchema);
