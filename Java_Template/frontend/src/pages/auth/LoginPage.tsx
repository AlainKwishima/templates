import { AuthLayout } from '@/components/layout/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useApiError } from '@/hooks/useApiError';
import { isEmailNotVerifiedError } from '@/utils/errors';
import { loginSchema, type LoginFormData } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './AuthForm.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useNotification();
  const { handleError } = useApiError();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setUnverifiedEmail(null);
    try {
      await login(data.email, data.password);
      success('Welcome back!');
      void navigate(from, { replace: true });
    } catch (err) {
      if (isEmailNotVerifiedError(err)) {
        setUnverifiedEmail(data.email);
      }
      handleError(err, 'Login failed');
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Enter your credentials to access your account"
      footer={
        <p>
          Don&apos;t have an account? <Link to={ROUTES.REGISTER}>Create one</Link>
        </p>
      }
    >
      {unverifiedEmail ? (
        <Alert variant="warning" title="Email not verified">
          Please verify your email before signing in.{' '}
          <Link to={ROUTES.RESEND_VERIFICATION} state={{ email: unverifiedEmail }}>
            Resend verification email
          </Link>
        </Alert>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className={styles.actions}>
          <Link to={ROUTES.FORGOT_PASSWORD} className={styles.link}>
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
