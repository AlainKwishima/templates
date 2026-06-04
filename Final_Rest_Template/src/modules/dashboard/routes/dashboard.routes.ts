import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorise } from '../../../middleware/authorise';
import * as dashboardController from '../controller/dashboard.controller';

const router = Router();

router.get('/', authenticate, authorise('Admin'), dashboardController.getDashboard);

export default router;
