import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { branchSchema, branchUpdateSchema, courseSchema, courseUpdateSchema, groupSchema, groupUpdateSchema } from '../../validators/crm.validator.js';
import * as crmController from '../../controllers/superadmin/crm.controller.js';

const router = Router();

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

router.get('/users', crmController.listUsers);
router.post('/users', crmController.createUser);
router.patch('/users/:id', crmController.updateUser);
router.delete('/users/:id', crmController.deleteUser);

router.get('/references', crmController.getReferenceData);

export default router;
