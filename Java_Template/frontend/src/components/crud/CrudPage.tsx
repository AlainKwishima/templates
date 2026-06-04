import { DataTable, type Column } from '@/components/table/DataTable';
import { Pagination } from '@/components/table/Pagination';
import { Button } from '@/components/ui/Button';
import type { PageResponse, PaginationMeta } from '@/api/types';
import type { ReactNode } from 'react';
import styles from './CrudPage.module.css';

interface CrudPageProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  meta?: PaginationMeta;
  loading?: boolean;
  keyExtractor: (row: T) => string | number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  createLabel?: string;
  onCreate?: () => void;
  filters?: ReactNode;
  headerActions?: ReactNode;
}

/**
 * Generic CRUD list page shell — reuse for new backend resources.
 */
export function CrudPage<T>({
  title,
  description,
  columns,
  data,
  meta,
  loading,
  keyExtractor,
  onPageChange,
  sortBy,
  sortDir,
  onSort,
  emptyTitle,
  emptyDescription,
  createLabel = 'Create',
  onCreate,
  filters,
  headerActions,
}: CrudPageProps<T>) {
  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {description ? <p className="page-description">{description}</p> : null}
        </div>
        <div className={styles.headerActions}>
          {headerActions}
          {onCreate ? (
            <Button onClick={onCreate}>{createLabel}</Button>
          ) : null}
        </div>
      </header>

      {filters ? <div className={styles.filters}>{filters}</div> : null}

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        loading={loading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={onSort}
      />

      {meta && onPageChange ? <Pagination meta={meta} onPageChange={onPageChange} /> : null}
    </div>
  );
}

export type { PageResponse };
