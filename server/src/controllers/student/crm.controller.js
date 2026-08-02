import mongoose from 'mongoose';
import { Attendance } from '../../models/Attendance.js';
import { Group } from '../../models/Group.js';
import { Homework } from '../../models/Homework.js';
import { HomeworkSubmission } from '../../models/HomeworkSubmission.js';
import { Notification } from '../../models/Notification.js';
import { Quiz } from '../../models/Quiz.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { Payment } from '../../models/Payment.js';
import { User } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { ok } from '../../utils/apiResponse.js';
import { QUIZ_STATUS, QUIZ_ATTEMPT_STATUS, SUBMISSION_STATUS, NOTIFICATION_TYPE } from '../../constants/status.js';
import { ROLES } from '../../constants/roles.js';

function buildListQuery(query = {}) {
  return { ...query, deleted: { $ne: true } };
}

export async function getDashboard(req, res, next) {
  try {
    const schedules = await Group.find({ studentIds: req.user._id }).populate('courseId', 'name').populate('teacherId', 'fullName');
    const homeworkCount = await Homework.countDocuments({ groupId: { $in: schedules.map((group) => group._id) } });
    const quizCount = await Quiz.countDocuments({ groupId: { $in: schedules.map((group) => group._id) }, status: QUIZ_STATUS.PUBLISHED });

    ok(res, {
      groups: schedules,
      homeworkCount,
      quizCount,
    });
  } catch (err) {
    next(err);
  }
}

import { Schedule } from '../../models/Schedule.js';

export async function listSchedules(req, res, next) {
  try {
    const groups = await Group.find({ studentIds: req.user._id }).select('_id');
    const schedules = await Schedule.find({ groupId: { $in: groups.map((group) => group._id) } })
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ startDate: -1 });

    ok(res, schedules);
  } catch (err) {
    next(err);
  }
}

export async function listAttendance(req, res, next) {
  try {
    const attendance = await Attendance.find({ 'records.studentId': req.user._id }).sort({ lessonDate: -1 });
    ok(res, attendance);
  } catch (err) {
    next(err);
  }
}

export async function listHomeworks(req, res, next) {
  try {
    const groups = await Group.find({ studentIds: req.user._id }).select('_id');
    const homeworks = await Homework.find({ groupId: { $in: groups.map((group) => group._id) }, status: { $ne: 'closed' } })
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ dueDate: 1 });

    ok(res, homeworks);
  } catch (err) {
    next(err);
  }
}

export async function submitHomework(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw ApiError.badRequest('Noto‘g‘ri uy vazifa identifikatori');
    }

    const homework = await Homework.findById(req.params.id);
    if (!homework) throw ApiError.notFound('Uy vazifa topilmadi');

    const group = await Group.findOne({ _id: homework.groupId, studentIds: req.user._id });
    if (!group) throw ApiError.forbidden('Siz bu guruhga tegishli emassiz');

    const submission = await HomeworkSubmission.findOneAndUpdate(
      { homeworkId: homework._id, studentId: req.user._id },
      {
        ...req.body,
        homeworkId: homework._id,
        studentId: req.user._id,
        submittedAt: new Date(),
        status: SUBMISSION_STATUS.SUBMITTED,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    await Notification.create({
      userId: req.user._id,
      type: NOTIFICATION_TYPE.HOMEWORK_ASSIGNED,
      title: 'Uy vazifa topshirildi',
      message: `Siz “${homework.title}” uy vazifasini topshirdingiz.`,
      relatedEntityType: 'HomeworkSubmission',
      relatedEntityId: submission._id,
      isRead: false,
    });

    ok(res, submission, 201);
  } catch (err) {
    next(err);
  }
}

export async function listQuizzes(req, res, next) {
  try {
    const groups = await Group.find({ studentIds: req.user._id }).select('_id');
    const quizzes = await Quiz.find({ groupId: { $in: groups.map((group) => group._id) }, status: QUIZ_STATUS.PUBLISHED })
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ availableFrom: -1 });

    ok(res, quizzes);
  } catch (err) {
    next(err);
  }
}

export async function startQuizAttempt(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw ApiError.badRequest("Noto'g'ri test identifikatori");
    }

    const quiz = await Quiz.findOne({ _id: req.params.id, status: QUIZ_STATUS.PUBLISHED });
    if (!quiz) throw ApiError.notFound('Test topilmadi');

    const group = await Group.findOne({ _id: quiz.groupId, studentIds: req.user._id });
    if (!group) throw ApiError.forbidden('Siz bu guruhga tegishli emassiz');

    // 1. Vaqt oralig'i nazorati
    const now = new Date();
    if (quiz.availableFrom && new Date(quiz.availableFrom) > now) {
      throw ApiError.badRequest('Test topshirish vaqti hali boshlanmagan');
    }
    if (quiz.availableTo && new Date(quiz.availableTo) < now) {
      throw ApiError.badRequest('Test topshirish vaqti tugagan');
    }

    // 2. Urinishlar soni nazorati
    const attemptsAllowed = quiz.attemptsAllowed ?? 1;
    const completedAttempts = await QuizAttempt.countDocuments({
      quizId: quiz._id,
      studentId: req.user._id,
      status: { $ne: QUIZ_ATTEMPT_STATUS.IN_PROGRESS },
    });
    if (completedAttempts >= attemptsAllowed) {
      throw ApiError.badRequest(`Ruxsat etilgan urinishlar soni tugagan (${attemptsAllowed} ta)`);
    }

    // 3. Faol urinishni qaytarish (dublikat yaratmaslik)
    const existingAttempt = await QuizAttempt.findOne({
      quizId: quiz._id,
      studentId: req.user._id,
      status: QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
    });
    if (existingAttempt) {
      return ok(res, existingAttempt, 200);
    }

    const attempt = await new QuizAttempt({
      quizId: quiz._id,
      studentId: req.user._id,
      answers: [],
      status: QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
    }).save();

    ok(res, attempt, 201);
  } catch (err) {
    next(err);
  }
}

export async function submitQuizAttempt(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw ApiError.badRequest('Noto‘g‘ri test identifikatori');
    }

    const quiz = await Quiz.findOne({ _id: req.params.id, status: QUIZ_STATUS.PUBLISHED });
    if (!quiz) throw ApiError.notFound('Test topilmadi');

    const group = await Group.findOne({ _id: quiz.groupId, studentIds: req.user._id });
    if (!group) throw ApiError.forbidden('Siz bu guruhga tegishli emassiz');

    const answers = req.body.answers ?? [];
    let score = 0;
    const maxScore = computeQuizMaxScore(quiz);

    for (const answer of answers) {
      const question = quiz.questions?.[answer.questionIndex];
      if (!question) continue;
      if (question.type === 'single' || question.type === 'multiple' || question.type === 'true_false') {
        const correct = Array.isArray(answer.selectedOptions)
          ? answer.selectedOptions.sort((a, b) => a - b).join(',') ===
            (question.correctAnswers || []).sort((a, b) => a - b).join(',')
          : false;
        if (correct) score += question.points ?? 1;
      }
    }

    const attempt = await QuizAttempt.findOneAndUpdate(
      { quizId: quiz._id, studentId: req.user._id, status: { $ne: QUIZ_ATTEMPT_STATUS.GRADED } },
      {
        quizId: quiz._id,
        studentId: req.user._id,
        answers,
        score,
        maxScore,
        submittedAt: new Date(),
        status: QUIZ_ATTEMPT_STATUS.SUBMITTED,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    await Notification.create({
      userId: req.user._id,
      type: NOTIFICATION_TYPE.QUIZ_ASSIGNED,
      title: 'Test topshirildi',
      message: `Siz “${quiz.title}” testini topshirdingiz.`,
      relatedEntityType: 'QuizAttempt',
      relatedEntityId: attempt._id,
      isRead: false,
    });

    ok(res, attempt);
  } catch (err) {
    next(err);
  }
}

function computeQuizMaxScore(quiz) {
  return (quiz.questions || []).reduce((total, question) => total + (question.points ?? 1), 0);
}

export async function listGrades(req, res, next) {
  try {
    const homeworkSubmissions = await HomeworkSubmission.find({ studentId: req.user._id })
      .populate('homeworkId', 'title maxScore')
      .populate('gradedBy', 'fullName')
      .sort({ submittedAt: -1 });

    const quizAttempts = await QuizAttempt.find({ studentId: req.user._id, status: { $in: [QUIZ_ATTEMPT_STATUS.SUBMITTED, QUIZ_ATTEMPT_STATUS.GRADED] } })
      .populate('quizId', 'title')
      .sort({ submittedAt: -1 });

    ok(res, { homeworkSubmissions, quizAttempts });
  } catch (err) {
    next(err);
  }
}

export async function listPayments(req, res, next) {
  try {
    const payments = await Payment.find({ studentId: req.user._id }).sort({ paymentDate: -1 });
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
