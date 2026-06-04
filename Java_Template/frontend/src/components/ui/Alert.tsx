import { cn } from '@/utils/cn';
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Alert.module.css';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}

export function Alert({ variant = 'info', title, children, className, ...props }: AlertProps) {
  return (
    <div className={cn(styles.alert, styles[variant], className)} role="alert" {...props}>
      {title ? <p className={styles.title}>{title}</p> : null}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
