interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-slate-600">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
