import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGenerateInvoice, useInvoices } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { extractErrorMessage } from '../utils/apiError';

const schema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  periodStart: z.string().min(1, 'Start date is required'),
  periodEnd: z.string().min(1, 'End date is required'),
  dueInDays: z.coerce.number().int().positive().optional(),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function InvoicesPage() {
  const [clientFilter, setClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data: clients } = useClients({ page: 1, limit: 100 });
  const { data, isLoading } = useInvoices({ clientId: clientFilter || undefined, page });
  const generateInvoice = useGenerateInvoice();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  const clientNameById = new Map((clients?.content ?? []).map((c) => [c._id, c.name]));

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setFormSuccess(null);
    try {
      const invoice = await generateInvoice.mutateAsync(values);
      setFormSuccess(`Invoice #${invoice.invoiceNumber} generated.`);
      reset();
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Generate invoice from unbilled time</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <select {...register('clientId')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select client</option>
              {clients?.content.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-xs text-red-600">{errors.clientId.message}</p>}
          </div>
          <input type="date" {...register('periodStart')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="date" {...register('periodEnd')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input
            type="number"
            placeholder="Due in days (default 30)"
            {...register('dueInDays')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {(errors.periodStart || errors.periodEnd) && (
          <p className="mt-1 text-xs text-red-600">{errors.periodStart?.message ?? errors.periodEnd?.message}</p>
        )}
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        {formSuccess && <p className="mt-2 text-sm text-green-600">{formSuccess}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Generate invoice
        </button>
      </form>

      <div>
        <select
          value={clientFilter}
          onChange={(e) => {
            setClientFilter(e.target.value);
            setPage(1);
          }}
          className="mb-4 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All clients</option>
          {clients?.content.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : !data || data.content.length === 0 ? (
          <p className="text-slate-500">No invoices yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Due date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="px-4 py-2 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-2 text-slate-600">{clientNameById.get(invoice.client) ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {invoice.total.toFixed(2)} {invoice.currency}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/invoices/${invoice._id}`} className="text-xs font-medium text-slate-900 underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
      </div>
    </div>
  );
}
