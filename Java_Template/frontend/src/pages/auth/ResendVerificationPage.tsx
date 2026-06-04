import { authApi } from '@/api';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants';
import { useNotification } from '@/contexts/NotificationContext';
import { useApiError } from '@/hooks/useApiError';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';
import styles from './AuthForm.module.css';

export function ResendVerificationPage() {
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string })?.email ?? '';
  const { success } = useNotification();
  const { handleError } = useApiError();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: prefilledEmail },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.resendVerification(data);
      success('If an unverified account exists, a new verification link has been sent.');
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <AuthLayout
      title="Resend verification"
      subtitle="Enter your email to receive a new verification link"
      footer={
        <p>
          <Link to={ROUTES.LOGIN}>Back to sign in</Link>
        </p>
      }
    >
      <Alert variant="info">
        If an unverified account with that email exists, a new verification link will be sent.
      </Alert>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Resend verification email
        </Button>
      </form>
    </AuthLayout>
  );
}
