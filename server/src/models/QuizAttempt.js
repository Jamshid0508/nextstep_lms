import mongoose from 'mongoose';
import { QUIZ_ATTEMPT_STATUS } from '../constants/status.js';

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedOptions: [{ type: Number }],
    textAnswer: { type: String, trim: true },
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
    score: { type: Number },
    maxScore: { type: Number },
    feedback: { type: String, trim: true },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(QUIZ_ATTEMPT_STATUS),
      default: QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
    },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ quizId: 1, studentId: 1 });

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
