import mongoose from 'mongoose';
import { Group } from '../../models/Group.js';
import { Schedule } from '../../models/Schedule.js';
import { Attendance } from '../../models/Attendance.js';
import { FinanceSection } from '../../models/FinanceSection.js';
import { User } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { ok } from '../../utils/apiResponse.js';

function buildListQuery(query = {}) {
  return { ...query, deleted: { $ne: true } };
}

async function ensureTeacherGroup(groupId, teacherId) {
  return Group.findOne({ _id: groupId, teacherId });
}

// GET /teacher/dashboard
export async function getDashboard(req, res, next) {
  try {
    const groups = await Group.find({ teacherId: req.user._id, status: 'active' }).select('_id name');
    const groupIds = groups.map((g) => g._id);

    const schedulesCount = await Schedule.countDocuments({ groupId: { $in: groupIds } });
    const attendanceCount = await Attendance.countDocuments({ groupId: { $in: groupIds } });

    ok(res, {
      groupsCount: groups.length,
      schedulesCount,
      attendanceCount,
    });
  } catch (err) {
    next(err);
  }
}

// GET /teacher/references — o'qituvchiga tegishli guruhlar ro'yxati
export async function getReferenceData(req, res, next) {
  try {
    const groups = await Group.find({ teacherId: req.user._id, status: 'active' }).select('_id name').sort({ name: 1 });
    ok(res, { groups });
  } catch (err) {
    next(err);
  }
}

// GET /teacher/groups — o'qituvchining barcha guruhlari
export async function listTeacherGroups(req, res, next) {
  try {
    const groups = await Group.find({ teacherId: req.user._id })
      .populate('courseId', 'name price')
      .populate('branchId', 'name')
      .populate('studentIds', 'fullName phone email studentType')
      .sort({ createdAt: -1 });

    ok(res, groups);
  } catch (err) {
    next(err);
  }
}

// GET /teacher/schedules — o'qituvchining dars jadvallari
export async function listTeacherSchedules(req, res, next) {
  try {
    const teacherGroups = await Group.find({ teacherId: req.user._id }).select('_id');
    const groupIds = teacherGroups.map((g) => g._id);

    const schedules = await Schedule.find({ groupId: { $in: groupIds } })
      .populate('groupId', 'name')
      .populate('teacherId', 'fullName')
      .sort({ createdAt: -1 });

    ok(res, schedules);
  } catch (err) {
    next(err);
  }
}

// GET /teacher/attendance/group/:groupId — guruh davomat ma'lumotlari (oylik)
export async function getTeacherGroupAttendanceDetails(req, res, next) {
  try {
    const { groupId } = req.params;
    const group = await ensureTeacherGroup(groupId, req.user._id);
    if (!group) {
      throw ApiError.forbidden("Siz ushbu guruhga o'qituvchi qilib biriktirilmagansiz");
    }

    const targetMonth = Number(req.query?.month ?? new Date().getMonth());
    const targetYear = Number(req.query?.year ?? new Date().getFullYear());

    const groupData = await Group.findById(groupId)
      .populate('courseId', 'name price')
      .populate('branchId', 'name')
      .populate('studentIds', 'fullName phone email')
      .lean();

    const schedule = await Schedule.findOne({ groupId }).lean();

    const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const attendances = await Attendance.find({
      groupId,
      lessonDate: { $gte: monthStart, $lte: monthEnd },
    })
      .populate('markedBy', 'fullName')
      .populate('records.studentId', 'fullName phone')
      .sort({ lessonDate: 1 })
      .lean();

    ok(res, {
      group: groupData,
      schedule,
      attendances,
      month: targetMonth,
      year: targetYear,
    });
  } catch (err) {
    next(err);
  }
}

// POST /teacher/attendance — davomat belgilash / saqlash
export async function createOrUpdateTeacherAttendance(req, res, next) {
  try {
    const { groupId, lessonDate, records, notes } = req.body;
    if (!groupId || !lessonDate) {
      throw ApiError.badRequest("Guruh va dars sanasi kiritilishi shart");
    }

    const group = await ensureTeacherGroup(groupId, req.user._id);
    if (!group) {
      throw ApiError.forbidden("Siz ushbu guruhga davomat belgilay olmaysiz");
    }

    const startOfDay = new Date(lessonDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(lessonDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      groupId,
      lessonDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const payload = {
      groupId,
      lessonDate: new Date(lessonDate),
      records: records || [],
      notes: notes || '',
      markedBy: req.user._id,
    };

    if (existing) {
      const updated = await Attendance.findByIdAndUpdate(existing._id, payload, {
        new: true,
        runValidators: true,
      });
      return ok(res, updated);
    }

    const attendance = await Attendance.create(payload);
    ok(res, attendance, 201);
  } catch (err) {
    next(err);
  }
}

// GET /teacher/payroll — o'qituvchining oylik maoshi va tushuntirish
export async function getTeacherPayroll(req, res, next) {
  try {
    const targetMonth = Number(req.query?.month ?? new Date().getMonth());
    const targetYear = Number(req.query?.year ?? new Date().getFullYear());

    // 1. Fetch FinanceSection records for this teacher
    const records = await FinanceSection.find({
      teacherId: req.user._id,
      month: targetMonth,
      year: targetYear,
    }).sort({ date: -1 });

    const teacherSalaryRecord = records.find((r) => r.category === 'teacher_salary');
    const bonuses = records.filter((r) => r.category === 'bonus');
    const penalties = records.filter((r) => r.category === 'penalty');

    const totalBonus = bonuses.reduce((s, b) => s + (b.amount || 0), 0);
    const totalPenalty = penalties.reduce((s, p) => s + (p.amount || 0), 0);

    // 2. Fetch group attendance breakdown for live estimate
    const groups = await Group.find({ teacherId: req.user._id, status: { $ne: 'deleted' } })
      .populate('courseId', 'price')
      .lean();

    const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const attendances = await Attendance.find({
      groupId: { $in: groups.map((g) => g._id) },
      lessonDate: { $gte: monthStart, $lte: monthEnd },
    }).lean();

    const attendanceMap = new Map();
    attendances.forEach((att) => {
      const gId = String(att.groupId);
      if (!attendanceMap.has(gId)) attendanceMap.set(gId, []);
      attendanceMap.get(gId).push(att);
    });

    const allStudentIds = [];
    groups.forEach((g) => {
      if (Array.isArray(g.studentIds)) {
        g.studentIds.forEach((sid) => allStudentIds.push(String(sid)));
      }
    });

    const students = await User.find({ _id: { $in: [...new Set(allStudentIds)] } }).select('_id fullName').lean();
    const studentMap = new Map(students.map((s) => [String(s._id), s.fullName]));

    let calculatedBaseSalary = 0;
    const studentBreakdown = [];

    groups.forEach((group) => {
      const studentIds = Array.isArray(group.studentIds) ? group.studentIds.map((s) => String(s)) : [];
      const lessonsInMonth = attendanceMap.get(String(group._id)) ?? [];
      const totalLessons = lessonsInMonth.length > 0 ? lessonsInMonth.length : 12;
      const studentFee = Number(group.courseId?.price || 300000);
      const perLessonFee = totalLessons > 0 ? studentFee / totalLessons : 0;

      studentIds.forEach((studentId) => {
        const presentCount = lessonsInMonth.reduce((acc, lesson) => {
          const record = (lesson.records ?? []).find((r) => String(r.studentId) === studentId);
          return acc + (record && record.status === 'present' ? 1 : 0);
        }, 0);

        const contribution = Number((presentCount * perLessonFee).toFixed(2));
        calculatedBaseSalary += contribution;

        studentBreakdown.push({
          groupId: group._id,
          groupName: group.name,
          studentId,
          studentName: studentMap.get(studentId) || "O'quvchi",
          studentFee,
          totalLessons,
          presentCount,
          perLessonFee: Number(perLessonFee.toFixed(2)),
          contribution,
        });
      });
    });

    const finalBaseSalary = teacherSalaryRecord ? teacherSalaryRecord.amount : calculatedBaseSalary;
    const netPayable = finalBaseSalary + totalBonus - totalPenalty;

    ok(res, {
      teacherSalaryRecord,
      baseSalary: finalBaseSalary,
      totalBonus,
      totalPenalty,
      netPayable,
      bonusesAndPenalties: [...bonuses, ...penalties],
      studentBreakdown,
      month: targetMonth,
      year: targetYear,
    });
  } catch (err) {
    next(err);
  }
}
