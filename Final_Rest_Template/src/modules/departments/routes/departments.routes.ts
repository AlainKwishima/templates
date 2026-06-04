import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorise } from '../../../middleware/authorise';
import { validate } from '../../../middleware/validate';
import { uuidParamSchema } from '../../../shared/zod/common.schemas';
import * as departmentsController from '../controller/departments.controller';
import {
  createDepartmentSchema,
  departmentQuerySchema,
  updateDepartmentSchema,
} from '../validation/departments.schemas';

const router = Router();

router.get('/', authenticate, validate({ query: departmentQuerySchema }), departmentsController.listDepartments);
router.get('/:id', authenticate, validate({ params: uuidParamSchema }), departmentsController.getDepartment);

router.post('/', authenticate, authorise('Admin'), validate(createDepartmentSchema), departmentsController.createDepartment);
router.put(
  '/:id',
  authenticate,
  authorise('Admin'),
  validate({ params: uuidParamSchema, body: updateDepartmentSchema }),
  departmentsController.updateDepartment,
);
router.delete(
  '/:id',
  authenticate,
  authorise('Admin'),
  validate({ params: uuidParamSchema }),
  departmentsController.deleteDepartment,
);

export default router;
