import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorise } from '../../../middleware/authorise';
import { validate } from '../../../middleware/validate';
import { uuidParamSchema } from '../../../shared/zod/common.schemas';
import * as rolesController from '../controller/roles.controller';
import { createRoleSchema, updateRoleSchema } from '../validation/roles.schemas';

const router = Router();

router.use(authenticate, authorise('Admin'));

router.get('/', rolesController.listRoles);
router.get('/:id', validate({ params: uuidParamSchema }), rolesController.getRole);
router.post('/', validate(createRoleSchema), rolesController.createRole);
router.put(
  '/:id',
  validate({ params: uuidParamSchema, body: updateRoleSchema }),
  rolesController.updateRole,
);
router.delete('/:id', validate({ params: uuidParamSchema }), rolesController.deleteRole);

export default router;
