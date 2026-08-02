import mongoose from 'mongoose';
import { ALL_ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ALL_ROLES, required: true },
    studentType: { type: String, enum: ['restricted', 'paid'], default: 'restricted' },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    lastLoginAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpiresAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ branchId: 1 });

export const User = mongoose.model('User', userSchema);
