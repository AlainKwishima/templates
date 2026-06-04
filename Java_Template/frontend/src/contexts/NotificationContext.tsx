import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
}

interface NotificationContextValue {
  notifications: Notification[];
  notify: (notification: Omit<Notification, 'id'>) => void;
  dismiss: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let notificationId = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = String(++notificationId);
      setNotifications((current) => [...current, { ...notification, id }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, title?: string) => notify({ type: 'success', message, title }),
    [notify],
  );

  const error = useCallback(
    (message: string, title?: string) => notify({ type: 'error', message, title }),
    [notify],
  );

  const warning = useCallback(
    (message: string, title?: string) => notify({ type: 'warning', message, title }),
    [notify],
  );

  const info = useCallback(
    (message: string, title?: string) => notify({ type: 'info', message, title }),
    [notify],
  );

  const value = useMemo(
    () => ({ notifications, notify, dismiss, success, error, warning, info }),
    [notifications, notify, dismiss, success, error, warning, info],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
