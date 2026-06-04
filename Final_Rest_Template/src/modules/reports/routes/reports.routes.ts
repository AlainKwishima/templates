import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorise } from '../../../middleware/authorise';
import * as reportsController from '../controller/reports.controller';

const router = Router();

router.use(authenticate, authorise('Admin'));

router.get('/users', reportsController.userReport);
router.get('/resources', reportsController.resourceReport);
router.get('/transactions', reportsController.transactionReport);
router.get('/departments', reportsController.departmentReport);

export default router;
