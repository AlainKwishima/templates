import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.code}>404</h1>
      <h2 className={styles.title}>Page not found</h2>
      <p className={styles.description}>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to={ROUTES.DASHBOARD}>
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  );
}
