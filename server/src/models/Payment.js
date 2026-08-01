import mongoose from 'mongoose';
import { PAYMENT_METHOD, PAYMENT_STATUS, PAYMENT_TYPE } from '../constants/status.js';

const paymentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date },
    paymentType: { type: String, enum: Object.values(PAYMENT_TYPE), required: true },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD) },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    dueDate: { type: Date },
    paidDate: { type: Date },
    note: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

paymentSchema.index({ studentId: 1 });
paymentSchema.index({ groupId: 1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
