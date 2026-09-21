const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 text-sm">
      <span className="text-slate-500">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button className="btn btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default Pagination;
