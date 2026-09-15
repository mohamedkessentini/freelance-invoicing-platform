const COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
};

export function StatusBadge({ status }: { status: string }) {
  const classes = COLORS[status] ?? 'bg-slate-100 text-slate-700';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>{status}</span>;
}
