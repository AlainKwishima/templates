import { Button } from '@/components/ui/Button';
import type { PaginationMeta } from '@/api/types';
import styles from './Pagination.module.css';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, first, last, totalElements, size } = meta;
  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className={styles.pagination}>
      <span className={styles.info}>
        {from}–{to} of {totalElements}
      </span>
      <div className={styles.controls}>
        <Button variant="secondary" size="sm" disabled={first} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className={styles.page}>
          Page {page + 1} of {Math.max(totalPages, 1)}
        </span>
        <Button variant="secondary" size="sm" disabled={last} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
