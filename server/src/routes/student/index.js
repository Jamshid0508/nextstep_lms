import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import * as studentController from '../../controllers/student/crm.controller.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { homeworkSubmissionSchema, quizAttemptSubmitSchema } from '../../validators/crm.validator.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.STUDENT));

router.get('/dashboard', studentController.getDashboard);
router.get('/schedules', studentController.listSchedules);
router.get('/attendance', studentController.listAttendance);
router.get('/homeworks', studentController.listHomeworks);
router.post('/homeworks/:id/submit', validateBody(homeworkSubmissionSchema), studentController.submitHomework);
router.get('/quizzes', studentController.listQuizzes);
router.post('/quizzes/:id/start', studentController.startQuizAttempt);
router.post('/quizzes/:id/submit', validateBody(quizAttemptSubmitSchema), studentController.submitQuizAttempt);
router.get('/grades', studentController.listGrades);
router.get('/payments', studentController.listPayments);
router.get('/notifications', studentController.listNotifications);
router.patch('/notifications/:id/read', studentController.markNotificationRead);

export default router;
