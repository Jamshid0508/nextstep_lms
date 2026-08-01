import mongoose from 'mongoose';

const parentChildSchema = new mongoose.Schema(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relationship: { type: String, enum: ['father', 'mother', 'guardian'], default: 'guardian' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

parentChildSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

export const ParentChild = mongoose.model('ParentChild', parentChildSchema);
