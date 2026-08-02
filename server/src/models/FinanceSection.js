import mongoose from 'mongoose';

const financeSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: ['expense', 'income'], required: true },
    category: {
      type: String,
      enum: ['manual', 'income', 'expense', 'teacher_salary', 'bonus', 'penalty', 'other'],
      default: 'manual',
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String, trim: true },
    balance: { type: Number, default: 0 },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    month: { type: Number, min: 0, max: 11 },
    year: { type: Number },
    reference: { type: String, trim: true },
    recipient: { type: String, trim: true },
    itemsReceived: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const FinanceSection = mongoose.model('FinanceSection', financeSectionSchema);
