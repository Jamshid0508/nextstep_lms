import mongoose from 'mongoose';
import XLSX from 'xlsx';
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
import { USER_STATUS } from '../../constants/status.js';
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
    const role = req.query.role ? String(req.query.role).toUpperCase() : undefined;
    const query = buildListQuery();

    if (role && Object.values(ROLES).includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('fullName phone email role status branchId studentType createdAt')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });
    ok(res, users);
  } catch (err) {
    next(err);
  }
}

function normalizeStudentType(value) {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (['paid', 'pulli', 'p', 'ha', 'yes'].includes(normalized)) {
    return 'paid';
  }

  if (['restricted', 'restrict', 'restr', 'r', 'no', 'yoʻq', 'yoq'].includes(normalized)) {
    return 'restricted';
  }

  return 'restricted';
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
      studentType: rest.role === ROLES.STUDENT ? normalizeStudentType(rest.studentType) : rest.studentType,
    });

    ok(res, user, 201);
  } catch (err) {
    next(err);
  }
}

export async function importUsers(req, res, next) {
  try {
    if (!req.file) {
      throw ApiError.badRequest('Excel fayl yuklanmadi');
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw ApiError.badRequest('Excel varaq topilmadi');
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    const branches = await Branch.find(buildListQuery()).select('_id name');
    const branchMap = branches.reduce((acc, branch) => {
      if (branch.name) {
        acc[branch.name.trim().toLowerCase()] = branch._id;
      }
      return acc;
    }, {});

    const defaultPasswordHash = await hashPassword('ChangeMe123!');
    const importedUsers = [];
    const errors = [];

    for (const [index, row] of Object.entries(rows)) {
      const rowIndex = Number(index) + 2;
      const fullName = String(row.fullName ?? row['F.I.Sh'] ?? row.FullName ?? '').trim();
      const phone = String(row.phone ?? row.Phone ?? '').trim();
      const emailValue = String(row.email ?? row.Email ?? '').trim();
      const email = emailValue ? emailValue.toLowerCase() : undefined;
      const roleValue = String(row.role ?? row.Role ?? '').trim().toUpperCase();
      const statusValue = String(row.status ?? row.Status ?? 'active').trim().toLowerCase();
      const studentTypeValue = String(row.studentType ?? row.StudentType ?? row.student_type ?? row.StudentType ?? 'restricted').trim().toLowerCase();
      const branchValue = String(row.branch ?? row.Branch ?? '').trim();

      if (!fullName || !phone || !roleValue) {
        errors.push(`Row ${rowIndex}: fullName, phone va role maydonlari majburiy`);
        continue;
      }

      if (!Object.values(ROLES).includes(roleValue)) {
        errors.push(`Row ${rowIndex}: rol noto'g'ri (${roleValue})`);
        continue;
      }

      if (statusValue && !Object.values(USER_STATUS).includes(statusValue)) {
        errors.push(`Row ${rowIndex}: holat noto'g'ri (${statusValue})`);
        continue;
      }

      const studentType = normalizeStudentType(studentTypeValue);

      const branchId = branchValue
        ? mongoose.isValidObjectId(branchValue)
          ? branchValue
          : branchMap[branchValue.toLowerCase()]
        : undefined;

      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        errors.push(`Row ${rowIndex}: telefon mavjud (${phone})`);
        continue;
      }

      if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          errors.push(`Row ${rowIndex}: email mavjud (${email})`);
          continue;
        }
      }

      const user = await User.create({
        fullName,
        phone,
        email,
        role: roleValue,
        studentType: roleValue === ROLES.STUDENT ? studentType : 'restricted',
        status: statusValue || USER_STATUS.ACTIVE,
        branchId,
        passwordHash: defaultPasswordHash,
      });

      importedUsers.push(user);
    }

    ok(res, { importedCount: importedUsers.length, errors });
  } catch (err) {
    next(err);
  }
}

export async function exportUsers(req, res, next) {
  try {
    const role = req.query.role ? String(req.query.role).toUpperCase() : undefined;
    const query = buildListQuery();

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('fullName phone email role status branchId')
      .populate('branchId', 'name')
      .sort({ fullName: 1 });

    const rows = users.map((user) => ({
      fullName: user.fullName,
      phone: user.phone,
      email: user.email ?? '',
      role: user.role,
      status: user.status,
      studentType: user.studentType ?? 'restricted',
      branch: user.branchId?.name ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${role ? role.toLowerCase() : 'users'}-export.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

export async function downloadUserImportTemplate(req, res, next) {
  try {
    const rows = [
      {
        fullName: 'Ali Valiyev',
        phone: '+998901234567',
        email: 'ali@example.com',
        role: 'STUDENT',
        status: 'active',
        studentType: 'restricted',
        branch: 'Tashkent',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['fullName', 'phone', 'email', 'role', 'status', 'studentType', 'branch'],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="user-import-template.xlsx"');
    res.send(buffer);
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

    if (req.body.role === ROLES.STUDENT && !req.body.studentType) {
      updatePayload.studentType = 'restricted';
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
      Course.find(buildListQuery()).select('_id name price').sort({ name: 1 }),
      User.find(buildListQuery()).where('role').in([ROLES.TEACHER, ROLES.ADMIN]).select('_id fullName').sort({ fullName: 1 }),
      User.find(buildListQuery()).where('role').equals(ROLES.STUDENT).select('_id fullName studentType').sort({ fullName: 1 }),
      User.find(buildListQuery()).where('role').equals(ROLES.PARENT).select('_id fullName').sort({ fullName: 1 }),
      Group.find(buildListQuery()).populate('courseId', 'name price').select('_id name courseId').sort({ name: 1 }),
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

export async function getFinanceSummary(req, res, next) {
  try {
    const summary = await FinanceSection.aggregate([
      { $match: buildListQuery() },
      {
        $group: {
          _id: null,
          income: {
            $sum: {
              $cond: [{ $eq: ['$kind', 'income'] }, '$amount', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$kind', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const current = summary[0] ?? { income: 0, expense: 0 };
    ok(res, {
      income: Number(current.income ?? 0),
      expense: Number(current.expense ?? 0),
      balance: Number((current.income ?? 0) - (current.expense ?? 0)),
    });
  } catch (err) {
    next(err);
  }
}

export async function listFinance(req, res, next) {
  try {
    const finance = await FinanceSection.find(buildListQuery())
      .populate('createdBy', 'fullName')
      .populate('teacherId', 'fullName')
      .populate('studentId', 'fullName')
      .populate('groupId', 'name')
      .sort({ date: -1, createdAt: -1 });

    ok(res, finance);
  } catch (err) {
    next(err);
  }
}

export async function createFinance(req, res, next) {
  try {
    const finance = await FinanceSection.create({
      ...req.body,
      category: req.body.category ?? (req.body.kind === 'income' ? 'income' : 'expense'),
      date: req.body.date ?? new Date(),
    });
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

export async function listTeacherPayroll(req, res, next) {
  try {
    const payroll = await FinanceSection.find(buildListQuery({ category: 'teacher_salary' }))
      .populate('teacherId', 'fullName')
      .populate('groupId', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 });

    ok(res, payroll);
  } catch (err) {
    next(err);
  }
}

export async function calculateTeacherPayroll(req, res, next) {
  try {
    const targetMonth = Number(req.body?.month ?? new Date().getMonth());
    const targetYear = Number(req.body?.year ?? new Date().getFullYear());

    const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const groups = await Group.find(buildListQuery({ teacherId: { $exists: true, $ne: null } }))
      .populate('teacherId', 'fullName')
      .populate('courseId', 'name price')
      .lean();

    const attendanceMap = new Map();
    const attendanceDocs = await Attendance.find({
      lessonDate: { $gte: monthStart, $lte: monthEnd },
    }).lean();

    for (const doc of attendanceDocs) {
      const groupId = String(doc.groupId);
      if (!attendanceMap.has(groupId)) attendanceMap.set(groupId, []);
      attendanceMap.get(groupId).push(doc);
    }

    const paymentDocs = await Payment.find({
      paymentDate: { $gte: monthStart, $lte: monthEnd },
      status: { $ne: 'cancelled' },
    }).lean();

    const generated = [];
    const teacherTotals = new Map();

    for (const group of groups) {
      const teacherId = group.teacherId?._id ? String(group.teacherId._id) : null;
      if (!teacherId) continue;

      const studentIds = Array.isArray(group.studentIds) ? group.studentIds.map((student) => String(student)) : [];
      const lessonsInMonth = attendanceMap.get(String(group._id)) ?? [];
      const studentLessonMap = new Map();

      for (const studentId of studentIds) {
        const presentCount = lessonsInMonth.reduce((total, lesson) => {
          const studentRecord = (lesson.records ?? []).find((record) => String(record.studentId) === studentId);
          return total + (studentRecord && studentRecord.status === 'present' ? 1 : 0);
        }, 0);
        studentLessonMap.set(studentId, presentCount);
      }

      let totalMonthPay = 0;

      for (const studentId of studentIds) {
        const studentTotal = paymentDocs.reduce((sum, payment) => {
          const sameStudent = String(payment.studentId) === studentId;
          const sameGroup = String(payment.groupId) === String(group._id);
          return sameStudent && sameGroup ? sum + Number(payment.amount ?? 0) : sum;
        }, 0);

        if (studentTotal <= 0) continue;

        const presentLessons = studentLessonMap.get(studentId) ?? 0;
        const baseValue = studentTotal / Math.max(lessonsInMonth.length || 1, 1);
        const teacherShare = Number((baseValue * presentLessons).toFixed(2));

        if (teacherShare > 0) {
          totalMonthPay += teacherShare;
          generated.push({
            teacherId,
            studentId,
            groupId: group._id,
            amount: teacherShare,
            name: "O'qituvchi oyligi — " + (group.name ?? 'Guruh'),
            kind: 'expense',
            category: 'teacher_salary',
            month: targetMonth,
            year: targetYear,
            date: new Date(targetYear, targetMonth, 1),
            description: `${group.teacherId?.fullName ?? "O'qituvchi"} uchun ${studentId} o'quvchining oylik hissasi`,
          });
        }
      }

      if (totalMonthPay > 0) {
        teacherTotals.set(teacherId, (teacherTotals.get(teacherId) ?? 0) + totalMonthPay);
      }
    }

    await FinanceSection.deleteMany({ category: 'teacher_salary', month: targetMonth, year: targetYear });

    const records = [];
    for (const [teacherId, amount] of teacherTotals.entries()) {
      const record = await FinanceSection.create({
        name: 'Oqituvchining oyligi',
        kind: 'expense',
        category: 'teacher_salary',
        teacherId,
        amount: Number(amount.toFixed(2)),
        month: targetMonth,
        year: targetYear,
        date: new Date(targetYear, targetMonth, 1),
        description: `Avtomatik oylik hisobi (${new Date(targetYear, targetMonth).toLocaleString('uz-UZ', { month: 'long' })} ${targetYear})`,
      });
      records.push(record);
    }

    ok(res, {
      message: 'Oylik hisoblandi',
      generated: records.length,
      records,
      breakdown: generated,
    }, 201);
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
