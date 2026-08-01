import { User } from '../../models/User.js';
import { Group } from '../../models/Group.js';
import { Payment } from '../../models/Payment.js';
import { ROLES } from '../../constants/roles.js';
import { GROUP_STATUS, PAYMENT_STATUS } from '../../constants/status.js';
import { ok } from '../../utils/apiResponse.js';

export async function getSummary(req, res, next) {
  try {
    const [studentsCount, teachersCount, activeGroupsCount, overduePaymentsCount] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.TEACHER }),
      Group.countDocuments({ status: GROUP_STATUS.ACTIVE }),
      Payment.countDocuments({ status: PAYMENT_STATUS.OVERDUE }),
    ]);

    ok(res, { studentsCount, teachersCount, activeGroupsCount, overduePaymentsCount });
  } catch (err) {
    next(err);
  }
}
