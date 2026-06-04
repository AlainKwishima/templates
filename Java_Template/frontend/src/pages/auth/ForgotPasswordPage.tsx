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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import styles from './AuthForm.module.css';

export function ForgotPasswordPage() {
  const { success } = useNotification();
  const { handleError } = useApiError();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data);
      setSent(true);
      success('If an account exists, a reset link has been sent.');
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <p>
          <Link to={ROUTES.LOGIN}>Back to sign in</Link>
        </p>
      }
    >
      {sent ? (
        <Alert variant="success">
          If an account with that email exists, a password reset link has been sent. Check your
          inbox.
        </Alert>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
