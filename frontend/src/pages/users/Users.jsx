import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { UserRound, Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../lib/utils';
import { api } from '../../api/endpoints';
import { toast } from 'react-hot-toast';

const columnHelper = createColumnHelper();

const roleToneMap = {
  admin: 'violet',
  manager: 'sky',
  sales: 'emerald',
  support: 'amber',
};

const roleLabelMap = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  support: 'Support',
};

function roleTone(role) {
  return roleToneMap[role] || 'slate';
}

function roleLabel(role) {
  return roleLabelMap[role] || role;
}

function statusTone(isActive) {
  return isActive === false ? 'slate' : 'emerald';
}

function statusLabel(isActive) {
  return isActive === false ? 'Inactive' : 'Active';
}

export default function Users() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.users.list();
      return response.data.data;
    },
  });

  const createUser = useMutation({
    mutationFn: (payload) => api.users.create(payload),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setEditingUser(null);
    },
    onError: () => {
      toast.error('Could not create user');
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }) => api.users.update(id, payload),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setEditingUser(null);
    },
    onError: () => {
      toast.error('Could not update user');
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id) => api.users.remove(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      toast.error('Could not delete user');
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (user) => {
    const confirmed = window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`);
    if (confirmed) {
      deleteUser.mutate(user._id || user.id);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData.entries());

    const isActiveInput = event.currentTarget.elements.namedItem('isActive');
    const isActive = isActiveInput ? isActiveInput.checked : true;

    const payload = {
      name: raw.name,
      email: raw.email,
      role: raw.role,
      phone: raw.phone || undefined,
      isActive,
    };

    if (editingUser) {
      if (raw.password && raw.password.trim() !== '') {
        payload.password = raw.password;
      }
      const recId = editingUser._id || editingUser.id;
      if (!recId) {
        toast.error('User record ID missing');
        return;
      }
      updateUser.mutate({ id: recId, payload });
    } else {
      if (!raw.password || raw.password.trim() === '') {
        toast.error('Password is required for new users');
        return;
      }
      payload.password = raw.password;
      createUser.mutate(payload);
    }
  };

  const columns = [
    columnHelper.accessor('name', {
      header: 'User',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/25 via-cyan-500/20 to-violet-500/25 text-sky-300">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{info.getValue()}</p>
            <p className="truncate text-xs text-slate-400">{info.row.original.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => (
        <Badge tone={roleTone(info.getValue())}>
          <Shield className="mr-1.5 h-3 w-3" />
          {roleLabel(info.getValue())}
        </Badge>
      ),
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) => {
        const active = info.getValue() !== false;
        return <Badge tone={statusTone(active)}>{statusLabel(active)}</Badge>;
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => <span className="text-slate-400">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openEditModal(info.row.original)}
            className="rounded-xl p-2 text-slate-300 transition hover:bg-white/8 hover:text-white"
            aria-label="Edit user"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(info.row.original)}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
            aria-label="Delete user"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: usersQuery.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isSubmitting = createUser.isPending || updateUser.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Permissions"
        description="Manage team members, roles, and permissions."
        actionLabel="Add user"
        onAction={openCreateModal}
      />

      {usersQuery.isLoading ? (
        <Card>
          <CardBody className="space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </CardBody>
        </Card>
      ) : (usersQuery.data || []).length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Add your first team member to start managing roles and permissions."
          actionLabel="Add user"
          onAction={openCreateModal}
        />
      ) : (
        <Card>
          <CardBody className="overflow-x-auto p-0 sm:p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-white/8">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-4 font-medium first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6"
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/8 text-slate-200 transition hover:bg-white/5"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-4 align-middle first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      <Modal
        open={modalOpen}
        size="lg"
        title={editingUser ? 'Edit user' : 'Add new user'}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-sky-500/5 to-cyan-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">
                  {editingUser ? 'Update team member' : 'Invite team member'}
                </h4>
                <p className="text-xs text-slate-300">
                  {editingUser
                    ? 'Adjust role, contact details, or access status for this user.'
                    : 'Set up credentials and assign a role to grant access to the workspace.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Full name</span>
              <Input
                name="name"
                type="text"
                placeholder="e.g. Priya Sharma"
                defaultValue={editingUser?.name || ''}
                required
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</span>
              <Input
                name="email"
                type="email"
                placeholder="priya@company.com"
                defaultValue={editingUser?.email || ''}
                required
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Password
                {editingUser ? (
                  <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-slate-500">
                    Leave empty to keep current password
                  </span>
                ) : null}
              </span>
              <Input
                name="password"
                type="password"
                placeholder={editingUser ? '•••••••• (leave empty to keep)' : 'Create a secure password'}
                required={!editingUser}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Role</span>
              <select
                name="role"
                defaultValue={editingUser?.role || 'sales'}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="sales">Sales</option>
                <option value="support">Support</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Phone</span>
              <Input
                name="phone"
                type="text"
                placeholder="+91 98765 43210"
                defaultValue={editingUser?.phone || ''}
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={editingUser ? editingUser.isActive !== false : true}
                className="h-4 w-4 rounded border-white/10 bg-white/5"
              />
              <div>
                <p className="text-sm font-medium text-white">Active status</p>
                <p className="text-xs text-slate-400">
                  When disabled, the user can no longer sign in to the workspace.
                </p>
              </div>
            </label>
          </div>

          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4" />
              {isSubmitting
                ? 'Saving…'
                : editingUser
                ? 'Save changes'
                : 'Create user'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
