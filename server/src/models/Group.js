import mongoose from 'mongoose';
import { GROUP_STATUS } from '../constants/status.js';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date },
    endDate: { type: Date },
    room: { type: String, trim: true },
    maxStudents: { type: Number, default: 15 },
    status: {
      type: String,
      enum: Object.values(GROUP_STATUS),
      default: GROUP_STATUS.ACTIVE,
    },
  },
  { timestamps: true },
);

groupSchema.index({ branchId: 1 });
groupSchema.index({ teacherId: 1 });

export const Group = mongoose.model('Group', groupSchema);
