import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClients, useCreateClient } from '../hooks/useClients';
import { Pagination } from '../components/Pagination';
import { extractErrorMessage } from '../utils/apiError';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useClients({ search: search || undefined, page });
  const createClient = useCreateClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await createClient.mutateAsync({
        name: values.name,
        company: values.company || undefined,
        email: values.email || undefined,
      });
      reset();
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">New client</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <input placeholder="Name" {...register('name')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <input placeholder="Company (optional)" {...register('company')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div>
            <input placeholder="Email (optional)" {...register('email')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
        </div>
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Add client
        </button>
      </form>

      <div>
        <input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="mb-4 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : !data || data.content.length === 0 ? (
          <p className="text-slate-500">No clients yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((client) => (
                  <tr key={client._id}>
                    <td className="px-4 py-2 font-medium text-slate-900">{client.name}</td>
                    <td className="px-4 py-2 text-slate-600">{client.company ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{client.email ?? '—'}</td>
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
