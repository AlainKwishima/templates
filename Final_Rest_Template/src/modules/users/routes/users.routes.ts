import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorise } from '../../../middleware/authorise';
import { validate } from '../../../middleware/validate';
import { uuidParamSchema } from '../../../shared/zod/common.schemas';
import * as usersController from '../controller/users.controller';
import { createUserSchema, updateUserSchema, userQuerySchema } from '../validation/users.schemas';

const router = Router();

router.use(authenticate, authorise('Admin'));

router.get('/', validate({ query: userQuerySchema }), usersController.listUsers);
router.get('/:id', validate({ params: uuidParamSchema }), usersController.getUser);
router.post('/', validate(createUserSchema), usersController.createUser);
router.put(
  '/:id',
  validate({ params: uuidParamSchema, body: updateUserSchema }),
  usersController.updateUser,
);
router.delete('/:id', validate({ params: uuidParamSchema }), usersController.deleteUser);

export default router;
