import { authApi } from '@/api';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/constants';
import { useApiError } from '@/hooks/useApiError';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { handleError } = useApiError();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    async function verify() {
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been verified successfully. You can now sign in.');
      } catch (err) {
        const parsed = handleError(err, 'Verification failed');
        setStatus('error');
        setMessage(parsed.message);
      }
    }

    void verify();
  }, [token, handleError]);

  return (
    <AuthLayout title="Email verification" subtitle="Verifying your email address">
      {status === 'loading' ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: '2rem' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Alert variant={status === 'success' ? 'success' : 'error'}>{message}</Alert>
      )}
      {status !== 'loading' ? (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to={ROUTES.LOGIN}>
            <Button fullWidth>Go to sign in</Button>
          </Link>
        </div>
      ) : null}
    </AuthLayout>
  );
}
