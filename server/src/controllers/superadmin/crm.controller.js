import mongoose from 'mongoose';
import { Attendance } from '../../models/Attendance.js';
import { AuditLog } from '../../models/AuditLog.js';
import { Branch } from '../../models/Branch.js';
import { Course } from '../../models/Course.js';
import { FinanceSection } from '../../models/FinanceSection.js';
import { Group } from '../../models/Group.js';
import { Homework } from '../../models/Homework.js';
import { HomeworkSubmission } from '../../models/HomeworkSubmission.js';
import { ParentChild } from '../../models/ParentChild.js';
import { Payment } from '../../models/Payment.js';
import { Quiz } from '../../models/Quiz.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { Schedule } from '../../models/Schedule.js';
import { Setting } from '../../models/Setting.js';
import { User } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { ok } from '../../utils/apiResponse.js';
import { ROLES } from '../../constants/roles.js';
import { hashPassword } from '../../utils/password.util.js';

function buildListQuery(query = {}) {
  return { ...query, deleted: { $ne: true } };
}

export async function listBranches(req, res, next) {
  try {
    const branches = await Branch.find(buildListQuery()).sort({ createdAt: -1 });
    ok(res, branches);
  } catch (err) {
    next(err);
  }
}

export async function createBranch(req, res, next) {
  try {
    const branch = await Branch.create(req.body);
    ok(res, branch, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateBranch(req, res, next) {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!branch) throw ApiError.notFound('Filial topilmadi');
    ok(res, branch);
  } catch (err) {
    next(err);
  }
}

export async function deleteBranch(req, res, next) {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) throw ApiError.notFound('Filial topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listCourses(req, res, next) {
  try {
    const courses = await Course.find(buildListQuery()).sort({ createdAt: -1 });
    ok(res, courses);
  } catch (err) {
    next(err);
  }
}

export async function createCourse(req, res, next) {
  try {
    const course = await Course.create(req.body);
    ok(res, course, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) throw ApiError.notFound('Kurs topilmadi');
    ok(res, course);
  } catch (err) {
    next(err);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) throw ApiError.notFound('Kurs topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listGroups(req, res, next) {
  try {
    const groups = await Group.find(buildListQuery())
      .populate('courseId', 'name')
      .populate('teacherId', 'fullName')
      .populate('branchId', 'name')
      .populate('studentIds', 'fullName phone')
      .sort({ createdAt: -1 });
    ok(res, groups);
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req, res, next) {
  try {
    const group = await Group.create(req.body);
    ok(res, group, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateGroup(req, res, next) {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!group) throw ApiError.notFound('Guruh topilmadi');
    ok(res, group);
  } catch (err) {
    next(err);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) throw ApiError.notFound('Guruh topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find(buildListQuery())
      .select('fullName phone email role status branchId createdAt')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });
    ok(res, users);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { password, ...rest } = req.body;

    if (!password || String(password).trim().length < 6) {
      throw ApiError.badRequest('Parol kamida 6 belgidan iborat bo’lishi kerak');
    }

    const user = await User.create({
      ...rest,
      passwordHash: await hashPassword(password),
    });

    ok(res, user, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { password, ...rest } = req.body;
    const updatePayload = { ...rest };

    if (password) {
      updatePayload.passwordHash = await hashPassword(password);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });
    if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
    ok(res, user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function getReferenceData(req, res, next) {
  try {
    const [branches, courses, teachers, students, parents, groups] = await Promise.all([
      Branch.find(buildListQuery()).select('_id name').sort({ name: 1 }),
      Course.find(buildListQuery()).select('_id name').sort({ name: 1 }),
      User.find(buildListQuery()).where('role').in([ROLES.TEACHER, ROLES.ADMIN]).select('_id fullName').sort({ fullName: 1 }),
      User.find(buildListQuery()).where('role').equals(ROLES.STUDENT).select('_id fullName').sort({ fullName: 1 }),
      User.find(buildListQuery()).where('role').equals(ROLES.PARENT).select('_id fullName').sort({ fullName: 1 }),
      Group.find(buildListQuery()).select('_id name').sort({ name: 1 }),
    ]);

    ok(res, { branches, courses, teachers, students, parents, groups });
  } catch (err) {
    next(err);
  }
}

export async function listParentChildren(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.parentId)) {
      throw ApiError.badRequest('Noto‘g‘ri ota-ona identifikatori');
    }

    const parent = await User.findById(req.params.parentId)
      .where('role')
      .equals(ROLES.PARENT)
      .select('_id fullName');

    if (!parent) throw ApiError.notFound('Ota-ona topilmadi');

    const children = await ParentChild.find({ parentId: parent._id })
      .populate('studentId', 'fullName phone email')
      .sort({ createdAt: -1 });

    ok(res, { parent, children });
  } catch (err) {
    next(err);
  }
}

export async function linkChildToParent(req, res, next) {
  try {
    const { studentId, relationship } = req.body;

    if (!mongoose.isValidObjectId(req.params.parentId) || !mongoose.isValidObjectId(studentId)) {
      throw ApiError.badRequest('Noto‘g‘ri ota-ona yoki talaba identifikatori');
    }

    const [parent, student] = await Promise.all([
      User.findById(req.params.parentId).where('role').equals(ROLES.PARENT),
      User.findById(studentId).where('role').equals(ROLES.STUDENT),
    ]);

    if (!parent) throw ApiError.notFound('Ota-ona topilmadi');
    if (!student) throw ApiError.notFound('Talaba topilmadi');

    const relation = await ParentChild.findOneAndUpdate(
      { parentId: parent._id, studentId: student._id },
      { relationship: relationship ?? 'guardian', createdBy: req.user?._id ?? parent._id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    ok(res, relation, 201);
  } catch (err) {
    next(err);
  }
}

export async function unlinkChildFromParent(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.parentId) || !mongoose.isValidObjectId(req.params.studentId)) {
      throw ApiError.badRequest('Noto‘g‘ri ota-ona yoki talaba identifikatori');
    }

    const deleted = await ParentChild.findOneAndDelete({
      parentId: req.params.parentId,
      studentId: req.params.studentId,
    });

    if (!deleted) throw ApiError.notFound('Bog’lanish topilmadi');
    ok(res, { parentId: req.params.parentId, studentId: req.params.studentId, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listSchedules(req, res, next) {
  try {
    const schedules = await Schedule.find(buildListQuery())
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ createdAt: -1 });

    ok(res, schedules);
  } catch (err) {
    next(err);
  }
}

export async function createSchedule(req, res, next) {
  try {
    const schedule = await Schedule.create(req.body);
    ok(res, schedule, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateSchedule(req, res, next) {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!schedule) throw ApiError.notFound('Dars jadvali topilmadi');
    ok(res, schedule);
  } catch (err) {
    next(err);
  }
}

export async function deleteSchedule(req, res, next) {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) throw ApiError.notFound('Dars jadvali topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listAttendances(req, res, next) {
  try {
    const attendances = await Attendance.find(buildListQuery())
      .populate('groupId', 'name')
      .populate('markedBy', 'fullName')
      .populate('records.studentId', 'fullName')
      .sort({ lessonDate: -1 });

    ok(res, attendances);
  } catch (err) {
    next(err);
  }
}

export async function createAttendance(req, res, next) {
  try {
    const attendance = await Attendance.create(req.body);
    ok(res, attendance, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAttendance(req, res, next) {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!attendance) throw ApiError.notFound('Davomat topilmadi');
    ok(res, attendance);
  } catch (err) {
    next(err);
  }
}

export async function deleteAttendance(req, res, next) {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) throw ApiError.notFound('Davomat topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listPayments(req, res, next) {
  try {
    const payments = await Payment.find(buildListQuery())
      .populate('studentId', 'fullName')
      .populate('groupId', 'name')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    ok(res, payments);
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req, res, next) {
  try {
    const payment = await Payment.create(req.body);
    ok(res, payment, 201);
  } catch (err) {
    next(err);
  }
}

export async function updatePayment(req, res, next) {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!payment) throw ApiError.notFound('To’lov topilmadi');
    ok(res, payment);
  } catch (err) {
    next(err);
  }
}

export async function deletePayment(req, res, next) {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) throw ApiError.notFound('To’lov topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listFinance(req, res, next) {
  try {
    const finance = await FinanceSection.find(buildListQuery())
      .populate('createdBy', 'fullName')
      .sort({ date: -1, createdAt: -1 });

    ok(res, finance);
  } catch (err) {
    next(err);
  }
}

export async function createFinance(req, res, next) {
  try {
    const finance = await FinanceSection.create(req.body);
    ok(res, finance, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateFinance(req, res, next) {
  try {
    const finance = await FinanceSection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!finance) throw ApiError.notFound('Moliya yozuvi topilmadi');
    ok(res, finance);
  } catch (err) {
    next(err);
  }
}

export async function deleteFinance(req, res, next) {
  try {
    const finance = await FinanceSection.findByIdAndDelete(req.params.id);
    if (!finance) throw ApiError.notFound('Moliya yozuvi topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.find(buildListQuery())
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 });

    ok(res, logs);
  } catch (err) {
    next(err);
  }
}

export async function createSettings(req, res, next) {
  try {
    const setting = await Setting.create(req.body);
    ok(res, setting, 201);
  } catch (err) {
    next(err);
  }
}

export async function listHomeworks(req, res, next) {
  try {
    const homeworks = await Homework.find(buildListQuery())
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ dueDate: 1, createdAt: -1 });

    ok(res, homeworks);
  } catch (err) {
    next(err);
  }
}

export async function createHomework(req, res, next) {
  try {
    const homework = await Homework.create(req.body);
    ok(res, homework, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateHomework(req, res, next) {
  try {
    const homework = await Homework.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!homework) throw ApiError.notFound('Uy vazifasi topilmadi');
    ok(res, homework);
  } catch (err) {
    next(err);
  }
}

export async function deleteHomework(req, res, next) {
  try {
    const homework = await Homework.findByIdAndDelete(req.params.id);
    if (!homework) throw ApiError.notFound('Uy vazifasi topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find(buildListQuery())
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ availableFrom: -1, createdAt: -1 });

    ok(res, quizzes);
  } catch (err) {
    next(err);
  }
}

export async function createQuiz(req, res, next) {
  try {
    const quiz = await Quiz.create(req.body);
    ok(res, quiz, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!quiz) throw ApiError.notFound('Test topilmadi');
    ok(res, quiz);
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) throw ApiError.notFound('Test topilmadi');
    ok(res, { id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function getGrades(req, res, next) {
  try {
    const [homeworkSubmissions, quizAttempts] = await Promise.all([
      HomeworkSubmission.find(buildListQuery())
        .populate('homeworkId', 'title maxScore')
        .populate('studentId', 'fullName')
        .populate('gradedBy', 'fullName')
        .sort({ gradedAt: -1, createdAt: -1 }),
      QuizAttempt.find(buildListQuery())
        .populate('quizId', 'title maxScore')
        .populate('studentId', 'fullName')
        .sort({ submittedAt: -1, createdAt: -1 }),
    ]);

    ok(res, { homeworkSubmissions, quizAttempts });
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req, res, next) {
  try {
    const setting = await Setting.findOne(buildListQuery()).sort({ createdAt: -1 });

    if (!setting) {
      const created = await Setting.create({
        organizationName: "Next Step O'quv Markazi",
        timezone: 'Asia/Tashkent',
        currency: 'UZS',
      });
      ok(res, created);
      return;
    }

    ok(res, setting);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const setting = await Setting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!setting) throw ApiError.notFound('Sozlamalar topilmadi');
    ok(res, setting);
  } catch (err) {
    next(err);
  }
}
