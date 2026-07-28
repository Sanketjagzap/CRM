import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../../api/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../ui/button';
import { Card, CardBody } from '../ui/card';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../common/Skeleton';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

function resolvePath(obj, path) {
  if (obj == null || !path) return undefined;
  if (!path.includes('.')) return obj[path];
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function getId(record) {
  return record?._id || record?.id || record?.uuid || '';
}

function formatFieldValue(value, fieldType) {
  if (value == null) return undefined;
  if (fieldType === 'checkbox') return Boolean(value);
  if (fieldType === 'date' && value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (fieldType === 'datetime-local' && value instanceof Date) {
    return value.toISOString().slice(0, 16);
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return value;
}

function Field({ field, value }) {
  const typedValue = formatFieldValue(value, field.type);
  const commonProps = {
    name: field.name,
    defaultValue: typedValue ?? field.defaultValue ?? '',
    placeholder: field.placeholder,
  };

  if (field.type === 'textarea') {
    return (
      <textarea
        rows="4"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
        {...commonProps}
      />
    );
  }

  if (field.type === 'select') {
    const options = field.options || [];
    return (
      <select
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
        {...commonProps}
        required={field.required || undefined}
      >
        {!field.required && (
          <option value="">{field.placeholder || 'Select an option'}</option>
        )}
        {options.map((opt) => {
          const v = typeof opt === 'string' ? opt : opt.value;
          const l =
            typeof opt === 'string'
              ? opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')
              : opt.label;
          return (
            <option key={String(v)} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name={field.name}
          defaultChecked={Boolean(typedValue)}
          className="h-4 w-4 rounded border-white/10 bg-white/5"
        />
        <span className="text-sm text-slate-300">{field.placeholder || field.label}</span>
      </label>
    );
  }

  if (field.type === 'number') {
    return (
      <Input
        type="number"
        step={field.step || 'any'}
        min={field.min}
        max={field.max}
        {...commonProps}
      />
    );
  }

  return <Input type={field.type || 'text'} {...commonProps} />;
}

export function ResourcePage({
  title,
  description,
  queryKey,
  listFn,
  createFn,
  updateFn,
  deleteFn,
  columns,
  fields,
  emptyActionLabel,
  emptyDescription,
  modalSize,
  pageLimit = 10,
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const listQuery = useQuery({
    queryKey: [queryKey, page, debouncedSearch],
    queryFn: async () => {
      const response = await listFn({ page, limit: pageLimit, search: debouncedSearch });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => createFn(payload),
    onSuccess: () => {
      toast.success(`${title} saved`);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
      setSelected(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || `Failed to save ${title}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => updateFn(id, payload),
    onSuccess: () => {
      toast.success(`${title} updated`);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
      setSelected(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || `Failed to update ${title}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => deleteFn(id),
    onSuccess: () => {
      toast.success(`${title} deleted`);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || `Failed to delete ${title}`);
    },
  });

  const table = useReactTable({
    data: listQuery.data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const unflatten = (obj) => {
    const result = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val === '' || val === null || val === undefined) continue;
      const keys = key.split('.');
      let cur = result;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!cur[k]) cur[k] = {};
        cur = cur[k];
      }
      const last = keys[keys.length - 1];
      const num = Number(val);
      const isBoolFalse = String(val) === 'false';
      const isBoolTrue = String(val) === 'true';
      if (isBoolTrue || isBoolFalse) {
        cur[last] = isBoolTrue;
      } else {
        cur[last] = !Number.isNaN(num) && String(num) === String(val) ? num : val;
      }
    }
    return result;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const flat = {};
    for (const [k, v] of formData.entries()) {
      if (flat[k] !== undefined) {
        flat[k] = Array.isArray(flat[k]) ? [...flat[k], v] : [flat[k], v];
      } else {
        flat[k] = v;
      }
    }
    const payload = unflatten(flat);
    const selectedId = getId(selected);
    if (selectedId) {
      updateMutation.mutate({ id: selectedId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const fieldsCount = fields?.length || 0;
  const effectiveModalSize = modalSize || (fieldsCount > 10 ? 'lg' : fieldsCount > 16 ? 'xl' : 'md');

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${title.toLowerCase()}`}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {listQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      ) : (listQuery.data?.data || []).length === 0 ? (
        <EmptyState
          title={`No ${title.toLowerCase()} yet`}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={() => {
            setSelected(null);
            setOpen(true);
          }}
        />
      ) : (
        <Card>
          <CardBody className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const rowId = getId(row.original);
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-white/8 text-slate-200 transition hover:bg-white/5"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-4 align-top">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-lg p-2 hover:bg-white/8"
                            title="Edit"
                            onClick={() => {
                              setSelected(row.original);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-lg p-2 text-rose-300 hover:bg-white/8"
                            title="Delete"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete this ${title.slice(0, -1)}? This action cannot be undone.`
                                )
                              ) {
                                if (rowId) deleteMutation.mutate(rowId);
                                else toast.error('Record ID missing');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
              <span>
                {listQuery.data?.total
                  ? `Showing ${Math.min(page * pageLimit, listQuery.data.total)} of ${
                      listQuery.data.total
                    }`
                  : `Updated ${formatDate(new Date())}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((value) => Math.max(value - 1, 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setPage((value) => value + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        open={open}
        size={effectiveModalSize}
        title={`${selected ? 'Edit' : 'Create'} ${title.slice(0, -1)}`}
        onClose={() => setOpen(false)}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(fields || []).map((field, i) => (
              <label
                key={field.name + '-' + i}
                className={`block space-y-2 ${field.fullWidth ? 'sm:col-span-2' : ''}`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {field.label}
                </span>
                <Field field={field} value={resolvePath(selected, field.name)} />
              </label>
            ))}
          </div>
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-4 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : selected ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}