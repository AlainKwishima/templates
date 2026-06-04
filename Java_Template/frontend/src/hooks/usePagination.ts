import { useCallback, useState } from 'react';

export function usePagination(initialPage = 0, initialSize = 10) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = useCallback((field: string) => {
    setSortBy((current) => {
      if (current === field) {
        setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return current;
      }
      setSortDir('asc');
      return field;
    });
    setPage(0);
  }, []);

  const reset = useCallback(() => {
    setPage(0);
  }, []);

  return {
    page,
    size,
    sortBy,
    sortDir,
    setPage,
    setSize,
    setSortBy,
    setSortDir,
    toggleSort,
    reset,
  };
}
