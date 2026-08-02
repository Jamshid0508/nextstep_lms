import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import * as teacherController from '../../controllers/teacher/crm.controller.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.TEACHER));

router.get('/dashboard', (req, res, next) => teacherController.getDashboard(req, res, next));
router.get('/references', (req, res, next) => teacherController.getReferenceData(req, res, next));
router.get('/groups', (req, res, next) => teacherController.listTeacherGroups(req, res, next));
router.get('/schedules', (req, res, next) => teacherController.listTeacherSchedules(req, res, next));
router.get('/attendance/group/:groupId', (req, res, next) => teacherController.getTeacherGroupAttendanceDetails(req, res, next));
router.post('/attendance', (req, res, next) => teacherController.createOrUpdateTeacherAttendance(req, res, next));
router.get('/payroll', (req, res, next) => teacherController.getTeacherPayroll(req, res, next));

export default router;
