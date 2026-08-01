import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import * as parentController from '../../controllers/parent/crm.controller.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.PARENT));

router.get('/dashboard', (req, res, next) => parentController.getDashboard(req, res, next));
router.get('/children', (req, res, next) => parentController.listChildren(req, res, next));
router.get('/children/:studentId/dashboard', (req, res, next) => parentController.getChildDashboard(req, res, next));
router.get('/children/:studentId/attendance', (req, res, next) => parentController.listChildAttendance(req, res, next));
router.get('/children/:studentId/homeworks', (req, res, next) => parentController.listChildHomeworks(req, res, next));
router.get('/children/:studentId/grades', (req, res, next) => parentController.getChildGrades(req, res, next));
router.get('/children/:studentId/payments', (req, res, next) => parentController.listChildPayments(req, res, next));
router.get('/notifications', (req, res, next) => parentController.listNotifications(req, res, next));
router.patch('/notifications/:id/read', (req, res, next) => parentController.markNotificationRead(req, res, next));

export default router;
