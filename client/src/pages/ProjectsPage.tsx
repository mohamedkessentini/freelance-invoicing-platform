import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { extractErrorMessage } from '../utils/apiError';

const schema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  name: z.string().min(1, 'Name is required'),
  hourlyRate: z.coerce.number().positive('Rate must be positive'),
  currency: z.string().length(3, 'Use a 3-letter code, e.g. EUR'),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function ProjectsPage() {
  const [clientFilter, setClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data: clients } = useClients({ page: 1, limit: 100 });
  const { data, isLoading } = useProjects({ clientId: clientFilter || undefined, page });
  const createProject = useCreateProject();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: { currency: 'EUR' } });

  const clientNameById = new Map((clients?.content ?? []).map((c) => [c._id, c.name]));

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await createProject.mutateAsync(values);
      reset({ currency: 'EUR' });
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">New project</h2>
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
          <div>
            <input placeholder="Project name" {...register('name')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <input
              type="number"
              step="0.01"
              placeholder="Hourly rate"
              {...register('hourlyRate')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {errors.hourlyRate && <p className="mt-1 text-xs text-red-600">{errors.hourlyRate.message}</p>}
          </div>
          <div>
            <input placeholder="Currency" {...register('currency')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {errors.currency && <p className="mt-1 text-xs text-red-600">{errors.currency.message}</p>}
          </div>
        </div>
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Add project
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
          <p className="text-slate-500">No projects yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Rate</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((project) => (
                  <tr key={project._id}>
                    <td className="px-4 py-2 font-medium text-slate-900">{project.name}</td>
                    <td className="px-4 py-2 text-slate-600">{clientNameById.get(project.client) ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {project.hourlyRate} {project.currency}/h
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={project.status} />
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
