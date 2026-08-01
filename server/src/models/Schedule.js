import mongoose from 'mongoose';

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const scheduleSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    weekDays: [{ type: String, enum: WEEK_DAYS }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startDate: { type: Date, required: true },
    lessonDuration: { type: Number },
    durationValue: { type: Number },
    durationUnit: { type: String, enum: ['week', 'month'], default: 'month' },
    generatedLessons: [
      {
        date: Date,
        startTime: String,
        endTime: String,
      },
    ],
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

scheduleSchema.index({ groupId: 1 });

export const Schedule = mongoose.model('Schedule', scheduleSchema);
