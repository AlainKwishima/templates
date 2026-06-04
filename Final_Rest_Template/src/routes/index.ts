import { Router } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes';
import usersRoutes from '../modules/users/routes/users.routes';
import rolesRoutes from '../modules/roles/routes/roles.routes';
import departmentsRoutes from '../modules/departments/routes/departments.routes';
import resourcesRoutes from '../modules/resources/routes/resources.routes';
import transactionsRoutes from '../modules/transactions/routes/transactions.routes';
import reportsRoutes from '../modules/reports/routes/reports.routes';
import dashboardRoutes from '../modules/dashboard/routes/dashboard.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/departments', departmentsRoutes);
router.use('/resources', resourcesRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/reports', reportsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
