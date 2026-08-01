import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import * as dashboardController from '../../controllers/superadmin/dashboard.controller.js';
import * as crmController from '../../controllers/superadmin/crm.controller.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import {
  attendanceSchema,
  attendanceUpdateSchema,
  branchSchema,
  branchUpdateSchema,
  courseSchema,
  courseUpdateSchema,
  financeSchema,
  financeUpdateSchema,
  groupSchema,
  groupUpdateSchema,
  homeworkSchema,
  homeworkUpdateSchema,
  parentChildSchema,
  paymentSchema,
  paymentUpdateSchema,
  quizSchema,
  quizUpdateSchema,
  scheduleSchema,
  scheduleUpdateSchema,
  settingSchema,
  settingUpdateSchema,
} from '../../validators/crm.validator.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get('/dashboard/summary', dashboardController.getSummary);

router.get('/branches', crmController.listBranches);
router.post('/branches', validateBody(branchSchema), crmController.createBranch);
router.patch('/branches/:id', validateBody(branchUpdateSchema), crmController.updateBranch);
router.delete('/branches/:id', crmController.deleteBranch);

router.get('/courses', crmController.listCourses);
router.post('/courses', validateBody(courseSchema), crmController.createCourse);
router.patch('/courses/:id', validateBody(courseUpdateSchema), crmController.updateCourse);
router.delete('/courses/:id', crmController.deleteCourse);

router.get('/groups', crmController.listGroups);
router.post('/groups', validateBody(groupSchema), crmController.createGroup);
router.patch('/groups/:id', validateBody(groupUpdateSchema), crmController.updateGroup);
router.delete('/groups/:id', crmController.deleteGroup);

router.get('/schedules', crmController.listSchedules);
router.post('/schedules', validateBody(scheduleSchema), crmController.createSchedule);
router.patch('/schedules/:id', validateBody(scheduleUpdateSchema), crmController.updateSchedule);
router.delete('/schedules/:id', crmController.deleteSchedule);

router.get('/attendance', crmController.listAttendances);
router.post('/attendance', validateBody(attendanceSchema), crmController.createAttendance);
router.patch('/attendance/:id', validateBody(attendanceUpdateSchema), crmController.updateAttendance);
router.delete('/attendance/:id', crmController.deleteAttendance);

router.get('/payments', crmController.listPayments);
router.post('/payments', validateBody(paymentSchema), crmController.createPayment);
router.patch('/payments/:id', validateBody(paymentUpdateSchema), crmController.updatePayment);
router.delete('/payments/:id', crmController.deletePayment);

router.get('/finance', crmController.listFinance);
router.post('/finance', validateBody(financeSchema), crmController.createFinance);
router.patch('/finance/:id', validateBody(financeUpdateSchema), crmController.updateFinance);
router.delete('/finance/:id', crmController.deleteFinance);

router.get('/audit-logs', crmController.listAuditLogs);

router.get('/homeworks', crmController.listHomeworks);
router.post('/homeworks', validateBody(homeworkSchema), crmController.createHomework);
router.patch('/homeworks/:id', validateBody(homeworkUpdateSchema), crmController.updateHomework);
router.delete('/homeworks/:id', crmController.deleteHomework);

router.get('/quizzes', crmController.listQuizzes);
router.post('/quizzes', validateBody(quizSchema), crmController.createQuiz);
router.patch('/quizzes/:id', validateBody(quizUpdateSchema), crmController.updateQuiz);
router.delete('/quizzes/:id', crmController.deleteQuiz);

router.get('/grades', crmController.getGrades);

router.get('/settings', crmController.getSettings);
router.post('/settings', validateBody(settingSchema), crmController.createSettings);
router.patch('/settings/:id', validateBody(settingUpdateSchema), crmController.updateSettings);

router.get('/users', crmController.listUsers);
router.post('/users', crmController.createUser);
router.patch('/users/:id', crmController.updateUser);
router.delete('/users/:id', crmController.deleteUser);

router.get('/parents/:parentId/children', crmController.listParentChildren);
router.post('/parents/:parentId/link-child', validateBody(parentChildSchema), crmController.linkChildToParent);
router.delete('/parents/:parentId/unlink-child/:studentId', crmController.unlinkChildFromParent);

router.get('/references', crmController.getReferenceData);

export default router;
