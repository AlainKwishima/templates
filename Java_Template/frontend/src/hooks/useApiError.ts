import { useNotification } from '@/contexts/NotificationContext';
import { getFieldErrors, parseApiError } from '@/utils/errors';
import { useCallback } from 'react';

export function useApiError() {
  const { error: notifyError } = useNotification();

  const handleError = useCallback(
    (err: unknown, fallback = 'Something went wrong') => {
      const parsed = parseApiError(err);
      notifyError(parsed.message || fallback);
      return {
        message: parsed.message,
        fieldErrors: getFieldErrors(parsed.errors),
        status: parsed.status,
        code: parsed.code,
      };
    },
    [notifyError],
  );

  return { handleError, parseApiError, getFieldErrors };
}
