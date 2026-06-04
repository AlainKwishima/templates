import { GuestRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROLES, ROUTES } from '@/constants';
import { ApiDocsPage } from '@/pages/api-docs/ApiDocsPage';
import { AuditLogsPage } from '@/pages/audit/AuditLogsPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ResendVerificationPage } from '@/pages/auth/ResendVerificationPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { RolesPage } from '@/pages/roles/RolesPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { UserDetailPage } from '@/pages/users/UserDetailPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { Navigate, Route, Routes } from 'react-router-dom';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      <Route element={<GuestRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        <Route path={ROUTES.RESEND_VERIFICATION} element={<ResendVerificationPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogsPage />} />
          <Route path={ROUTES.API_DOCS} element={<ApiDocsPage />} />

          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path={ROUTES.USERS} element={<UsersPage />} />
            <Route path={ROUTES.USER_DETAIL} element={<UserDetailPage />} />
            <Route path={ROUTES.ROLES} element={<RolesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
}
