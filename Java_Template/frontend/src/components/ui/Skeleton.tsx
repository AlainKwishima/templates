import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, className }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton height={20} width="40%" />
      <Skeleton height={14} width="70%" />
      <Skeleton height={14} width="55%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.table}>
      <Skeleton height={40} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={48} />
      ))}
    </div>
  );
}
