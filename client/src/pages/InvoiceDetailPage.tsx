import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useInvoice, useUpdateInvoiceStatus } from '../hooks/useInvoices';
import { StatusBadge } from '../components/StatusBadge';
import { extractErrorMessage } from '../utils/apiError';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) return <p className="text-slate-500">Loading invoice...</p>;
  if (!invoice) return <p className="text-red-600">Invoice not found.</p>;

  async function transitionTo(status: 'SENT' | 'PAID') {
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ id: invoice!._id, status });
    } catch (error) {
      setActionError(extractErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/invoices" className="text-sm text-slate-500 hover:underline">
        &larr; Back to invoices
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Invoice #{invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Issued {new Date(invoice.issueDate).toLocaleDateString()} · Due{' '}
              {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Hours</th>
              <th className="pb-2 text-right">Rate</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lineItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2 text-slate-900">{item.description}</td>
                <td className="py-2 text-right text-slate-600">{item.hours}</td>
                <td className="py-2 text-right text-slate-600">
                  {item.rate} {invoice.currency}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {item.amount.toFixed(2)} {invoice.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-48 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>
                {invoice.subtotal.toFixed(2)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>
                {invoice.total.toFixed(2)} {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {actionError && <p className="mt-4 text-sm text-red-600">{actionError}</p>}

        <div className="mt-6 flex gap-3">
          {invoice.status === 'DRAFT' && (
            <button
              onClick={() => transitionTo('SENT')}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Mark as sent
            </button>
          )}
          {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
            <button
              onClick={() => transitionTo('PAID')}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Mark as paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
