import mongoose from 'mongoose';
import { ATTENDANCE_STATUS } from '../constants/status.js';

const attendanceSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    lessonDate: { type: Date, required: true },
    lessonStartTime: { type: String },
    lessonEndTime: { type: String },
    records: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: Object.values(ATTENDANCE_STATUS), required: true },
        note: { type: String, trim: true },
      },
    ],
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

attendanceSchema.index({ groupId: 1, lessonDate: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
