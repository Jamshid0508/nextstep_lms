import mongoose from 'mongoose';
import { SUBMISSION_STATUS } from '../constants/status.js';

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    homeworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submissionText: { type: String, trim: true },
    attachments: [{ name: String, url: String }],
    submittedAt: { type: Date },
    isLate: { type: Boolean, default: false },
    score: { type: Number },
    feedback: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.NOT_SUBMITTED,
    },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
  },
  { timestamps: true },
);

homeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

export const HomeworkSubmission = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
