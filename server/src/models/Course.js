import mongoose from 'mongoose';
import { COURSE_STATUS } from '../constants/status.js';

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    duration: { type: Number },
    price: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      default: COURSE_STATUS.ACTIVE,
    },
  },
  { timestamps: true },
);

export const Course = mongoose.model('Course', courseSchema);
