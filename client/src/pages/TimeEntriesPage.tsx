import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTimeEntry, useDeleteTimeEntry, useTimeEntries } from '../hooks/useTimeEntries';
import { useProjects } from '../hooks/useProjects';
import { Pagination } from '../components/Pagination';
import { extractErrorMessage } from '../utils/apiError';

const schema = z.object({
  projectId: z.string().min(1, 'Select a project'),
  date: z.string().min(1, 'Date is required'),
  hours: z.coerce.number().positive('Hours must be positive').max(24, 'Cannot exceed 24 hours'),
  description: z.string().min(1, 'Description is required'),
  billable: z.boolean().optional(),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function TimeEntriesPage() {
  const [projectFilter, setProjectFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data: projects } = useProjects({ page: 1, limit: 100 });
  const { data, isLoading } = useTimeEntries({ projectId: projectFilter || undefined, page });
  const createEntry = useCreateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: { billable: true } });

  const projectNameById = new Map((projects?.content ?? []).map((p) => [p._id, p.name]));

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await createEntry.mutateAsync(values);
      reset({ billable: true, projectId: values.projectId });
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Time Entries</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Log time</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div>
            <select {...register('projectId')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select project</option>
              {projects?.content.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId.message}</p>}
          </div>
          <input type="date" {...register('date')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input
            type="number"
            step="0.25"
            placeholder="Hours"
            {...register('hours')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input placeholder="Description" {...register('description')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-1" />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...register('billable')} defaultChecked />
            Billable
          </label>
        </div>
        {(errors.date || errors.hours || errors.description) && (
          <p className="mt-1 text-xs text-red-600">
            {errors.date?.message ?? errors.hours?.message ?? errors.description?.message}
          </p>
        )}
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Add entry
        </button>
      </form>

      <div>
        <select
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value);
            setPage(1);
          }}
          className="mb-4 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All projects</option>
          {projects?.content.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : !data || data.content.length === 0 ? (
          <p className="text-slate-500">No time entries yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Hours</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-4 py-2 text-slate-600">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-slate-600">{projectNameById.get(entry.project) ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{entry.hours}</td>
                    <td className="px-4 py-2 text-slate-600">{entry.description}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {entry.invoiced ? 'Invoiced' : entry.billable ? 'Billable' : 'Non-billable'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {!entry.invoiced && (
                        <button
                          onClick={() => deleteEntry.mutate(entry._id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
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
