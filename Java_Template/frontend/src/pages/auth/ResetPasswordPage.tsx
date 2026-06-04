import { authApi } from '@/api';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PASSWORD_HINT, ROUTES } from '@/constants';
import { useNotification } from '@/contexts/NotificationContext';
import { useApiError } from '@/hooks/useApiError';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './AuthForm.module.css';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { success } = useNotification();
  const { handleError } = useApiError();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    try {
      await authApi.resetPassword({ token, newPassword: data.newPassword });
      setDone(true);
      success('Password reset successfully');
      void navigate(ROUTES.LOGIN);
    } catch (err) {
      handleError(err, 'Password reset failed');
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is invalid or expired">
        <Alert variant="error">
          No reset token found. Please request a new password reset link.
        </Alert>
        <Link to={ROUTES.FORGOT_PASSWORD}>
          <Button fullWidth>Request new link</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your new password"
      footer={
        <p>
          <Link to={ROUTES.LOGIN}>Back to sign in</Link>
        </p>
      }
    >
      {done ? (
        <Alert variant="success">Your password has been reset. You can now sign in.</Alert>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint={PASSWORD_HINT}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Reset password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
