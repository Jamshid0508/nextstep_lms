import mongoose from 'mongoose';
import { QUIZ_QUESTION_TYPE, QUIZ_STATUS } from '../constants/status.js';

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(QUIZ_QUESTION_TYPE), required: true },
    options: [{ type: String }],
    correctAnswers: [{ type: Number }],
    points: { type: Number, default: 1 },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    questions: [questionSchema],
    timeLimitMinutes: { type: Number },
    availableFrom: { type: Date },
    availableTo: { type: Date },
    attemptsAllowed: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(QUIZ_STATUS),
      default: QUIZ_STATUS.DRAFT,
    },
  },
  { timestamps: true },
);

quizSchema.index({ groupId: 1 });

export const Quiz = mongoose.model('Quiz', quizSchema);
