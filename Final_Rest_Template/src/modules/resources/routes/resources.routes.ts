import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorise } from '../../../middleware/authorise';
import { validate } from '../../../middleware/validate';
import { uuidParamSchema } from '../../../shared/zod/common.schemas';
import * as resourcesController from '../controller/resources.controller';
import {
  createResourceSchema,
  resourceQuerySchema,
  updateResourceSchema,
} from '../validation/resources.schemas';

const router = Router();

router.get('/', authenticate, validate({ query: resourceQuerySchema }), resourcesController.listResources);
router.get('/:id', authenticate, validate({ params: uuidParamSchema }), resourcesController.getResource);

router.post('/', authenticate, authorise('Admin'), validate(createResourceSchema), resourcesController.createResource);
router.put(
  '/:id',
  authenticate,
  authorise('Admin'),
  validate({ params: uuidParamSchema, body: updateResourceSchema }),
  resourcesController.updateResource,
);
router.delete(
  '/:id',
  authenticate,
  authorise('Admin'),
  validate({ params: uuidParamSchema }),
  resourcesController.deleteResource,
);

export default router;
