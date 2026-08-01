import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import * as teacherController from '../../controllers/teacher/crm.controller.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import {
  homeworkSchema,
  homeworkUpdateSchema,
  quizSchema,
  quizUpdateSchema,
  teacherGradeHomeworkSchema,
  quizAttemptGradeSchema,
} from '../../validators/crm.validator.js';
import { ROLES } from '../../constants/roles.js';


const router = Router();
router.use(requireAuth, requireRole(ROLES.TEACHER));

router.get('/dashboard', (req, res, next) => teacherController.getDashboard(req, res, next));
router.get('/references', (req, res, next) => teacherController.getReferenceData(req, res, next));
router.get('/homeworks', (req, res, next) => teacherController.listHomeworks(req, res, next));
router.post('/homeworks', validateBody(homeworkSchema), (req, res, next) => teacherController.createHomework(req, res, next));
router.get('/homeworks/:id', (req, res, next) => teacherController.getHomework(req, res, next));
router.patch('/homeworks/:id', validateBody(homeworkUpdateSchema), (req, res, next) => teacherController.updateHomework(req, res, next));
router.delete('/homeworks/:id', (req, res, next) => teacherController.deleteHomework(req, res, next));
router.get('/homeworks/:id/submissions', (req, res, next) => teacherController.listHomeworkSubmissions(req, res, next));
router.patch('/homeworks/:id/submissions/:submissionId', validateBody(teacherGradeHomeworkSchema), (req, res, next) => teacherController.gradeHomeworkSubmission(req, res, next));

router.get('/quizzes', (req, res, next) => teacherController.listQuizzes(req, res, next));
router.post('/quizzes', validateBody(quizSchema), (req, res, next) => teacherController.createQuiz(req, res, next));
router.get('/quizzes/:id', (req, res, next) => teacherController.getQuiz(req, res, next));
router.patch('/quizzes/:id', validateBody(quizUpdateSchema), (req, res, next) => teacherController.updateQuiz(req, res, next));
router.delete('/quizzes/:id', (req, res, next) => teacherController.deleteQuiz(req, res, next));
router.patch('/quizzes/:id/publish', (req, res, next) => teacherController.publishQuiz(req, res, next));
router.get('/quizzes/:id/attempts', (req, res, next) => teacherController.listQuizAttempts(req, res, next));
router.patch('/quizzes/:id/attempts/:attemptId', validateBody(quizAttemptGradeSchema), (req, res, next) => teacherController.gradeQuizAttempt(req, res, next));

export default router;
