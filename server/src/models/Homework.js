import mongoose from 'mongoose';
import { HOMEWORK_STATUS } from '../constants/status.js';

const homeworkSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    attachments: [{ name: String, url: String }],
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    maxScore: { type: Number, default: 100 },
    status: {
      type: String,
      enum: Object.values(HOMEWORK_STATUS),
      default: HOMEWORK_STATUS.ACTIVE,
    },
  },
  { timestamps: true },
);

homeworkSchema.index({ groupId: 1 });
homeworkSchema.index({ teacherId: 1 });

export const Homework = mongoose.model('Homework', homeworkSchema);
