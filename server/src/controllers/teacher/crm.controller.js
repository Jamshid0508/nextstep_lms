import mongoose from 'mongoose';
import { Homework } from '../../models/Homework.js';
import { HomeworkSubmission } from '../../models/HomeworkSubmission.js';
import { Quiz } from '../../models/Quiz.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { Group } from '../../models/Group.js';
import { Notification } from '../../models/Notification.js';
import { ParentChild } from '../../models/ParentChild.js';
import { ApiError } from '../../utils/ApiError.js';
import { ok } from '../../utils/apiResponse.js';
import { HOMEWORK_STATUS, QUIZ_STATUS, QUIZ_ATTEMPT_STATUS, SUBMISSION_STATUS, NOTIFICATION_TYPE } from '../../constants/status.js';

function buildListQuery(query = {}) {
  return { ...query, deleted: { $ne: true } };
}

async function ensureTeacherGroup(groupId, teacherId) {
  return Group.findOne({ _id: groupId, teacherId });
}

function computeQuizMaxScore(quiz) {
  return (quiz.questions || []).reduce((total, question) => total + (question.points ?? 1), 0);
}

async function createNotificationsForHomework(homework, studentIds) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) return;

  const parentRelations = await ParentChild.find({ studentId: { $in: studentIds } }).select('parentId studentId');
  const now = new Date();

  const notifications = [
    ...studentIds.map((studentId) => ({
      userId: studentId,
      type: NOTIFICATION_TYPE.HOMEWORK_ASSIGNED,
      title: 'Yangi uy vazifa',
      message: `“${homework.title}” mavzusida uy vazifasi berildi.`,
      relatedEntityType: 'Homework',
      relatedEntityId: homework._id,
      isRead: false,
      createdAt: now,
    })),
    ...parentRelations.map((relation) => ({
      userId: relation.parentId,
      type: NOTIFICATION_TYPE.HOMEWORK_ASSIGNED,
      title: 'Farzandingizga yangi uy vazifa',
      message: `“${homework.title}” mavzusida farzandingizga uy vazifa berildi.`,
      relatedEntityType: 'Homework',
      relatedEntityId: homework._id,
      isRead: false,
      createdAt: now,
    })),
  ];

  await Notification.insertMany(notifications);
}

export async function getDashboard(req, res, next) {
  try {
    const groups = await Group.find({ teacherId: req.user._id }).select('_id');
    const groupIds = groups.map((group) => group._id);
    const homeworksCount = await Homework.countDocuments({ teacherId: req.user._id, deleted: { $ne: true } });
    const quizzesCount = await Quiz.countDocuments({ teacherId: req.user._id, status: QUIZ_STATUS.PUBLISHED });
    const pendingSubmissions = await HomeworkSubmission.countDocuments({ homeworkId: { $in: groupIds }, status: SUBMISSION_STATUS.SUBMITTED });

    ok(res, {
      groupsCount: groups.length,
      homeworksCount,
      quizzesCount,
      pendingSubmissions,
    });
  } catch (err) {
    next(err);
  }
}

// GET /teacher/homeworks — o'qituvchiga tegishli barcha uy vazifalari
export async function listHomeworks(req, res, next) {
  try {
    const homeworks = await Homework.find(buildListQuery({ teacherId: req.user._id }))
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ createdAt: -1 });
    ok(res, homeworks);
  } catch (err) {
    next(err);
  }
}

// GET /teacher/references — o'qituvchiga tegishli guruhlar
export async function getReferenceData(req, res, next) {
  try {
    const groups = await Group.find({ teacherId: req.user._id }).select('_id name').sort({ name: 1 });
    ok(res, { groups });
  } catch (err) {
    next(err);
  }
}

export async function createHomework(req, res, next) {
  try {
    const group = await ensureTeacherGroup(req.body.groupId, req.user._id);
    if (!group) {
      throw ApiError.forbidden('Sizga tegishli guruh topilmadi');
    }

    const homework = await Homework.create({ ...req.body, teacherId: req.user._id });

    await createNotificationsForHomework(homework, group.studentIds ?? []);

    ok(res, homework, 201);
  } catch (err) {
    next(err);
  }
}

export async function getHomework(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw ApiError.badRequest('Noto‘g‘ri uy vazifasi identifikatori');
    }

    const homework = await Homework.findOne({ _id: req.params.id, teacherId: req.user._id })
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName');

    if (!homework) throw ApiError.notFound('Uy vazifa topilmadi');
    ok(res, homework);
  } catch (err) {
    next(err);
  }
}

export async function updateHomework(req, res, next) {
  try {
    const homework = await Homework.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id }, 
      req.body,
      { new: true, runValidators: true },
    );
    if (!homework) throw ApiError.notFound('Uy vazifa topilmadi');
    ok(res, homework);
  } catch (err) {
    next(err);
  }
}

export async function deleteHomework(req, res, next) {
  try {
    const homework = await Homework.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    if (!homework) throw ApiError.notFound('Uy vazifa topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listHomeworkSubmissions(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw ApiError.badRequest('Noto‘g‘ri uy vazifasi identifikatori');
    }

    const homework = await Homework.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!homework) throw ApiError.notFound('Uy vazifa topilmadi');

    const submissions = await HomeworkSubmission.find({ homeworkId: homework._id })
      .populate('studentId', 'fullName')
      .sort({ createdAt: -1 });

    ok(res, { homework, submissions });
  } catch (err) {
    next(err);
  }
}

export async function gradeHomeworkSubmission(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.submissionId)) {
      throw ApiError.badRequest('Noto‘g‘ri identifikator');
    }

    const homework = await Homework.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!homework) throw ApiError.notFound('Uy vazifa topilmadi');

    const submission = await HomeworkSubmission.findOne({ _id: req.params.submissionId, homeworkId: homework._id });
    if (!submission) throw ApiError.notFound('Topshiriq topilmadi');

    submission.score = req.body.score ?? submission.score;
    submission.feedback = req.body.feedback ?? submission.feedback;
    submission.status = req.body.status ?? SUBMISSION_STATUS.GRADED;
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    await submission.save();

    ok(res, submission);
  } catch (err) {
    next(err);
  }
}

export async function listQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find(buildListQuery({ teacherId: req.user._id }))
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ createdAt: -1 });
    ok(res, quizzes);
  } catch (err) {
    next(err);
  }
}

export async function createQuiz(req, res, next) {
  try {
    const group = await ensureTeacherGroup(req.body.groupId, req.user._id);
    if (!group) {
      throw ApiError.forbidden('Sizga tegishli guruh topilmadi');
    }

    const quiz = await Quiz.create({ ...req.body, teacherId: req.user._id });
    ok(res, quiz, 201);
  } catch (err) {
    next(err);
  }
}

export async function getQuiz(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw ApiError.badRequest('Noto‘g‘ri test identifikatori');
    }

    const quiz = await Quiz.findOne({ _id: req.params.id, teacherId: req.user._id })
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName');

    if (!quiz) throw ApiError.notFound('Test topilmadi');
    ok(res, quiz);
  } catch (err) {
    next(err);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOneAndUpdate({ _id: req.params.id, teacherId: req.user._id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!quiz) throw ApiError.notFound('Test topilmadi');
    ok(res, quiz);
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    if (!quiz) throw ApiError.notFound('Test topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function publishQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      { status: QUIZ_STATUS.PUBLISHED },
      { new: true, runValidators: true },
    );
    if (!quiz) throw ApiError.notFound('Test topilmadi');
    ok(res, quiz);
  } catch (err) {
    next(err);
  }
}

export async function listQuizAttempts(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw ApiError.badRequest('Noto‘g‘ri test identifikatori');
    }

    const quiz = await Quiz.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!quiz) throw ApiError.notFound('Test topilmadi');

    const attempts = await QuizAttempt.find({ quizId: quiz._id })
      .populate('studentId', 'fullName')
      .sort({ createdAt: -1 });

    ok(res, { quiz, attempts });
  } catch (err) {
    next(err);
  }
}

export async function gradeQuizAttempt(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.attemptId)) {
      throw ApiError.badRequest('Noto‘g‘ri identifikator');
    }

    const quiz = await Quiz.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!quiz) throw ApiError.notFound('Test topilmadi');

    const attempt = await QuizAttempt.findOne({ _id: req.params.attemptId, quizId: quiz._id });
    if (!attempt) throw ApiError.notFound('Urinish topilmadi');

    attempt.score = req.body.score ?? attempt.score;
    attempt.feedback = req.body.feedback ?? attempt.feedback;
    attempt.status = req.body.status ?? QUIZ_ATTEMPT_STATUS.GRADED;
    attempt.gradedBy = req.user._id;
    attempt.gradedAt = new Date();
    await attempt.save();

    ok(res, attempt);
  } catch (err) {
    next(err);
  }
}
