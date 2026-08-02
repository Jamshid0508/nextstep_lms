import { Attendance } from '../../models/Attendance.js';
import { Branch } from '../../models/Branch.js';
import { FinanceSection } from '../../models/FinanceSection.js';
import { Group } from '../../models/Group.js';
import { Payment } from '../../models/Payment.js';
import { User } from '../../models/User.js';
import { ROLES } from '../../constants/roles.js';
import { GROUP_STATUS, PAYMENT_STATUS, ATTENDANCE_STATUS } from '../../constants/status.js';
import { ok } from '../../utils/apiResponse.js';

function buildListQuery(query = {}) {
  return { ...query, deleted: { $ne: true } };
}

export async function getSummary(req, res, next) {
  try {
    const isBranchAdmin = req.user?.role === ROLES.ADMIN && req.user?.branchId;
    const userBranchId = isBranchAdmin ? req.user.branchId : null;

    const studentMatch = userBranchId
      ? { role: ROLES.STUDENT, branchId: userBranchId }
      : { role: ROLES.STUDENT };

    const teacherMatch = userBranchId
      ? { role: ROLES.TEACHER, branchId: userBranchId }
      : { role: ROLES.TEACHER };

    const activeGroupMatch = userBranchId
      ? { status: GROUP_STATUS.ACTIVE, branchId: userBranchId }
      : { status: GROUP_STATUS.ACTIVE };

    // Get group IDs belonging to this branch if filtered
    const branchGroupFilter = userBranchId ? { branchId: userBranchId } : {};
    const branchGroups = userBranchId
      ? await Group.find(buildListQuery(branchGroupFilter)).select('_id')
      : null;
    const branchGroupIds = branchGroups ? branchGroups.map((g) => g._id) : null;

    const paymentMatch = userBranchId
      ? { status: PAYMENT_STATUS.OVERDUE, groupId: { $in: branchGroupIds } }
      : { status: PAYMENT_STATUS.OVERDUE };

    const financeMatch = userBranchId
      ? buildListQuery({ branchId: userBranchId })
      : buildListQuery();

    const attendanceMatch = userBranchId
      ? buildListQuery({ groupId: { $in: branchGroupIds } })
      : buildListQuery();

    const branchListQuery = userBranchId
      ? buildListQuery({ _id: userBranchId })
      : buildListQuery();

    const [
      studentsCount,
      teachersCount,
      activeGroupsCount,
      overduePaymentsCount,
      financeSummary,
      attendanceSummary,
      branches,
      studentBranchCounts,
      groupBranchCounts,
      paymentBranchStats,
      attendanceBranchStats,
    ] = await Promise.all([
      User.countDocuments(studentMatch),
      User.countDocuments(teacherMatch),
      Group.countDocuments(activeGroupMatch),
      Payment.countDocuments(paymentMatch),
      FinanceSection.aggregate([
        { $match: financeMatch },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ['$kind', 'income'] }, '$amount', 0] } },
            expense: { $sum: { $cond: [{ $eq: ['$kind', 'expense'] }, '$amount', 0] } },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: attendanceMatch },
        { $unwind: '$records' },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$records.status', ATTENDANCE_STATUS.PRESENT] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$records.status', ATTENDANCE_STATUS.ABSENT] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$records.status', ATTENDANCE_STATUS.LATE] }, 1, 0] } },
            excused: { $sum: { $cond: [{ $eq: ['$records.status', ATTENDANCE_STATUS.EXCUSED] }, 1, 0] } },
          },
        },
      ]),
      Branch.find(branchListQuery).select('_id name'),
      User.aggregate([
        { $match: buildListQuery({ role: ROLES.STUDENT, ...(userBranchId ? { branchId: userBranchId } : {}) }) },
        { $group: { _id: '$branchId', count: { $sum: 1 } } },
      ]),
      Group.aggregate([
        { $match: buildListQuery({ status: GROUP_STATUS.ACTIVE, ...(userBranchId ? { branchId: userBranchId } : {}) }) },
        { $group: { _id: '$branchId', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: buildListQuery(userBranchId ? { groupId: { $in: branchGroupIds } } : {}) },
        {
          $lookup: {
            from: 'groups',
            localField: 'groupId',
            foreignField: '_id',
            as: 'group',
          },
        },
        { $unwind: { path: '$group', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$group.branchId',
            totalAmount: { $sum: '$amount' },
            overdueCount: { $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.OVERDUE] }, 1, 0] } },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: buildListQuery(userBranchId ? { groupId: { $in: branchGroupIds } } : {}) },
        {
          $lookup: {
            from: 'groups',
            localField: 'groupId',
            foreignField: '_id',
            as: 'group',
          },
        },
        { $unwind: '$group' },
        { $unwind: '$records' },
        {
          $group: {
            _id: '$group.branchId',
            totalRecords: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$records.status', ATTENDANCE_STATUS.PRESENT] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$records.status', ATTENDANCE_STATUS.ABSENT] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$records.status', ATTENDANCE_STATUS.LATE] }, 1, 0] } },
            excused: { $sum: { $cond: [{ $eq: ['$records.status', ATTENDANCE_STATUS.EXCUSED] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const branchCounts = studentBranchCounts.reduce((acc, item) => {
      acc[String(item._id)] = item.count;
      return acc;
    }, {});

    const activeGroupCounts = groupBranchCounts.reduce((acc, item) => {
      acc[String(item._id)] = item.count;
      return acc;
    }, {});

    const paymentCounts = paymentBranchStats.reduce((acc, item) => {
      acc[String(item._id)] = {
        totalAmount: item.totalAmount || 0,
        overdueCount: item.overdueCount || 0,
      };
      return acc;
    }, {});

    const attendanceCounts = attendanceBranchStats.reduce((acc, item) => {
      acc[String(item._id)] = {
        totalRecords: item.totalRecords || 0,
        present: item.present || 0,
        absent: item.absent || 0,
        late: item.late || 0,
        excused: item.excused || 0,
      };
      return acc;
    }, {});

    const branchStats = branches.map((branch) => {
      const branchId = String(branch._id);
      const attendance = attendanceCounts[branchId] ?? { totalRecords: 0, present: 0, absent: 0, late: 0, excused: 0 };
      const attendancePercent = attendance.totalRecords > 0 ? (attendance.present / attendance.totalRecords) * 100 : 0;

      return {
        branchId,
        branchName: branch.name,
        studentCount: branchCounts[branchId] || 0,
        activeGroupsCount: activeGroupCounts[branchId] || 0,
        totalPaymentsAmount: paymentCounts[branchId]?.totalAmount || 0,
        overduePaymentsCount: paymentCounts[branchId]?.overdueCount || 0,
        attendancePresent: attendance.present,
        attendanceAbsent: attendance.absent,
        attendanceLate: attendance.late,
        attendanceExcused: attendance.excused,
        attendancePercent,
      };
    });

    const finance = financeSummary[0] ?? { income: 0, expense: 0 };
    const totalIncome = finance.income || 0;
    const totalExpense = finance.expense || 0;
    const financeBalance = totalIncome - totalExpense;
    const attendance = attendanceSummary[0] ?? { totalRecords: 0, present: 0, absent: 0, late: 0, excused: 0 };
    const attendancePercent = attendance.totalRecords > 0 ? (attendance.present / attendance.totalRecords) * 100 : 0;

    ok(res, {
      studentsCount,
      teachersCount,
      activeGroupsCount,
      overduePaymentsCount,
      totalIncome,
      totalExpense,
      financeBalance,
      attendanceTotal: attendance.totalRecords,
      attendancePresent: attendance.present,
      attendanceAbsent: attendance.absent,
      attendanceLate: attendance.late,
      attendanceExcused: attendance.excused,
      attendancePercent,
      branchStats,
    });
  } catch (err) {
    next(err);
  }
}
