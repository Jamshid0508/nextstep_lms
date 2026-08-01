import mongoose from 'mongoose';
import { Attendance } from '../../models/Attendance.js';
import { Group } from '../../models/Group.js';
import { Homework } from '../../models/Homework.js';
import { HomeworkSubmission } from '../../models/HomeworkSubmission.js';
import { Notification } from '../../models/Notification.js';
import { Payment } from '../../models/Payment.js';
import { ParentChild } from '../../models/ParentChild.js';
import { Quiz } from '../../models/Quiz.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { ApiError } from '../../utils/ApiError.js';
import { ok } from '../../utils/apiResponse.js';
import { ROLES } from '../../constants/roles.js';
import { QUIZ_ATTEMPT_STATUS } from '../../constants/status.js';

async function ensureParentChild(parentId, studentId) {
  return ParentChild.findOne({ parentId, studentId });
}

export async function getDashboard(req, res, next) {
  try {
    const relations = await ParentChild.find({ parentId: req.user._id }).populate('studentId', 'fullName');
    const studentIds = relations.map((relation) => relation.studentId?._id).filter(Boolean);
    const groups = await Group.find({ studentIds: { $in: studentIds } }).select('_id');
    const homeworksCount = await Homework.countDocuments({ groupId: { $in: groups.map((group) => group._id) } });
    const paymentsCount = await Payment.countDocuments({ studentId: { $in: studentIds } });
    const unreadNotificationsCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    ok(res, {
      childrenCount: relations.length,
      homeworksCount,
      paymentsCount,
      unreadNotificationsCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function listChildren(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.studentId)) {
      throw ApiError.badRequest('Noto‘g‘ri talaba identifikatori');
    }

    const relation = await ensureParentChild(req.user._id, req.params.studentId);
    if (!relation) throw ApiError.forbidden('Siz unga bog‘lanmagan talaba ma’lumotini ko‘ra olmaysiz');

    const group = await Group.findOne({ studentIds: req.params.studentId }).populate('courseId', 'name').populate('teacherId', 'fullName');
    const attendanceSummary = await Attendance.countDocuments({ 'records.studentId': req.params.studentId });
    const homeworkCount = await Homework.countDocuments({ groupId: group?._id });
    const quizCount = await Quiz.countDocuments({ groupId: group?._id, status: 'published' });

    ok(res, {
      student: relation.studentId,
      group,
      attendanceSummary,
      homeworkCount,
      quizCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function listChildAttendance(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.studentId)) {
      throw ApiError.badRequest('Noto‘g‘ri talaba identifikatori');
    }

    const relation = await ensureParentChild(req.user._id, req.params.studentId);
    if (!relation) throw ApiError.forbidden('Siz unga bog‘lanmagan talaba ma’lumotini ko‘ra olmaysiz');

    const attendance = await Attendance.find({ 'records.studentId': req.params.studentId }).sort({ lessonDate: -1 });
    ok(res, attendance);
  } catch (err) {
    next(err);
  }
}

export async function listChildHomeworks(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.studentId)) {
      throw ApiError.badRequest('Noto‘g‘ri talaba identifikatori');
    }

    const relation = await ensureParentChild(req.user._id, req.params.studentId);
    if (!relation) throw ApiError.forbidden('Siz unga bog‘lanmagan talaba ma’lumotini ko‘ra olmaysiz');

    const group = await Group.findOne({ studentIds: req.params.studentId }).select('_id');
    const homeworks = await Homework.find({ groupId: group?._id })
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ dueDate: -1 });

    const submissions = await HomeworkSubmission.find({ studentId: req.params.studentId })
      .populate('homeworkId', 'title maxScore')
      .sort({ submittedAt: -1 });

    ok(res, { homeworks, submissions });
  } catch (err) {
    next(err);
  }
}

export async function getChildGrades(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.studentId)) {
      throw ApiError.badRequest('Noto‘g‘ri talaba identifikatori');
    }

    const relation = await ensureParentChild(req.user._id, req.params.studentId);
    if (!relation) throw ApiError.forbidden('Siz unga bog‘lanmagan talaba ma’lumotini ko‘ra olmaysiz');

    const homeworkSubmissions = await HomeworkSubmission.find({ studentId: req.params.studentId })
      .populate('homeworkId', 'title maxScore')
      .populate('gradedBy', 'fullName')
      .sort({ submittedAt: -1 });

    const quizAttempts = await QuizAttempt.find({ studentId: req.params.studentId, status: { $in: [QUIZ_ATTEMPT_STATUS.SUBMITTED, QUIZ_ATTEMPT_STATUS.GRADED] } })
      .populate('quizId', 'title')
      .sort({ submittedAt: -1 });

    ok(res, { homeworkSubmissions, quizAttempts });
  } catch (err) {
    next(err);
  }
}

export async function listChildPayments(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.studentId)) {
      throw ApiError.badRequest('Noto‘g‘ri talaba identifikatori');
    }

    const relation = await ensureParentChild(req.user._id, req.params.studentId);
    if (!relation) throw ApiError.forbidden('Siz unga bog‘lanmagan talaba ma’lumotini ko‘ra olmaysiz');

    const payments = await Payment.find({ studentId: req.params.studentId }).sort({ paymentDate: -1 });
    ok(res, payments);
  } catch (err) {
    next(err);
  }
}

export async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    ok(res, notifications);
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw ApiError.badRequest('Noto‘g‘ri bildirishnoma identifikatori');
    }

    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true });
    if (!notification) throw ApiError.notFound('Bildirishnoma topilmadi');
    ok(res, notification);
  } catch (err) {
    next(err);
  }
}
