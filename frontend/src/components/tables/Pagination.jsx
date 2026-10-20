const PAGE_SIZES = [10, 25, 50, 100];

export default function Pagination({
  page = 0,
  pageCount = 1,
  itemsPerPage = 100,
  itemCount,
  onPageChange,
  onItemsPerPageChange,
}) {
  const hasPages = pageCount > 1;

  return (
    <div className="pagination">
      <div className="pagination__info">
        {typeof itemCount === 'number' && <span className="pagination__count">{itemCount} items</span>}
        {hasPages && (
          <span className="pagination__page">
            Page {page + 1} of {pageCount}
          </span>
        )}
      </div>
      <div className="pagination__controls">
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--sm"
          disabled={page <= 0}
          onClick={() => onPageChange?.(page - 1)}
        >
          Back
        </button>
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--sm"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange?.(page + 1)}
        >
          Next
        </button>
        {onItemsPerPageChange && (
          <label className="pagination__size">
            <span>Per page</span>
            <select value={itemsPerPage} onChange={(e) => onItemsPerPageChange(Number(e.target.value))}>
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
