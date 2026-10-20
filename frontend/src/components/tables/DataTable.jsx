import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';
import Pagination from './Pagination';

function getVal(row, key) {
  if (key == null || row == null) return undefined;
  return String(key)
    .split('.')
    .reduce((acc, part) => (acc == null ? undefined : acc[part]), row);
}

export default function DataTable({
  columns,
  data,
  loading = false,
  error,
  pagination,
  onRowClick,
  emptyMessage,
  initialSort = null,
}) {
  const { t } = useTranslation();
  const [sort, setSort] = useState(initialSort);
  const empty = emptyMessage ?? t('common.noItems');

  const rows = useMemo(() => {
    if (!sort || !Array.isArray(data)) return data || [];
    const dir = sort.dir === 'desc' ? -1 : 1;
    return [...data].sort((a, b) => {
      const av = getVal(a, sort.key);
      const bv = getVal(b, sort.key);
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [data, sort]);

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    setSort((prev) =>
      prev && prev.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: 'asc' }
    );
  };

  if (error) return <ErrorAlert error={error} />;
  if (loading && rows.length === 0) {
    return (
      <div className="table__loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="table">
      <div className="table__scroll">
        <table className="table__el">
          <thead>
            <tr>
              {columns.map((col) => {
                const sortable = col.sortable !== false;
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={sortable ? 'is-sortable' : ''}
                    onClick={() => toggleSort(col)}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {col.label}
                    {active && <span className="table__sort-indicator">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table__empty">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row?.id ?? row?.name ?? i}
                  className={onRowClick ? 'is-clickable' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row, col) : getVal(row, col.key) ?? '–'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
