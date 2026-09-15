import { useDashboardSummary } from '../hooks/useDashboard';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardSummary();

  if (isLoading) return <p className="text-slate-500">Loading dashboard...</p>;
  if (isError || !data) return <p className="text-red-600">Failed to load dashboard.</p>;

  const maxRevenue = Math.max(1, ...data.revenueByMonth.map((r) => r.total));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatMoney(data.outstandingTotal)} accent="text-amber-600" />
        <StatCard label="Paid to date" value={formatMoney(data.paidTotal)} accent="text-green-600" />
        <StatCard label="Hours this month" value={data.hoursLoggedThisMonth.toFixed(1)} accent="text-slate-900" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Revenue by month (paid invoices)</h2>
        {data.revenueByMonth.length === 0 ? (
          <p className="text-sm text-slate-500">No paid invoices yet.</p>
        ) : (
          <div className="space-y-2">
            {data.revenueByMonth.map((row) => (
              <div key={row.month} className="flex items-center gap-3">
                <span className="w-20 text-xs text-slate-500">{row.month}</span>
                <div className="h-4 flex-1 rounded bg-slate-100">
                  <div
                    className="h-4 rounded bg-slate-900"
                    style={{ width: `${(row.total / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs text-slate-700">{formatMoney(row.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
