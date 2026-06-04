import { useNotification } from '@/contexts/NotificationContext';
import { X } from 'lucide-react';
import styles from './NotificationToast.module.css';

export function NotificationToast() {
  const { notifications, dismiss } = useNotification();

  return (
    <div className={styles.container} aria-live="polite">
      {notifications.map((notification) => (
        <div key={notification.id} className={`${styles.toast} ${styles[notification.type]}`}>
          <div className={styles.content}>
            {notification.title ? (
              <p className={styles.title}>{notification.title}</p>
            ) : null}
            <p className={styles.message}>{notification.message}</p>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={() => dismiss(notification.id)}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
