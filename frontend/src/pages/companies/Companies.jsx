import { ResourcePage } from '../../components/crm/ResourcePage';
import { createColumnHelper } from '@tanstack/react-table';
import { Building2, Mail, Phone, TrendingUp } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { formatCurrency } from '../../components/dashboard/DashboardWidgets';
import { api } from '../../api/endpoints';
import { formatDate } from '../../lib/utils';

const columnHelper = createColumnHelper();

export default function Companies() {
  const columns = [
    columnHelper.accessor('name', {
      header: 'Company',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-white">{info.getValue()}</p>
            {info.row.original.industry && (
              <p className="text-xs text-slate-400">{info.row.original.industry}</p>
            )}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-2 text-slate-300">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          <span>{info.getValue()}</span>
        </div>
      ) : <span className="text-slate-500">—</span>,
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span>{info.getValue()}</span>
        </div>
      ) : <span className="text-slate-500">—</span>,
    }),
    columnHelper.accessor('totalRevenue', {
      header: 'Revenue',
      cell: (info) => {
        const v = info.getValue() || info.row.original.revenue || 0;
        return (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium text-emerald-300">{formatCurrency(v)}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('pendingAmount', {
      header: 'Pending',
      cell: (info) => info.getValue() ? (
        <Badge tone="amber">{formatCurrency(info.getValue())}</Badge>
      ) : <Badge tone="emerald">₹0</Badge>,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => <span className="text-slate-400">{formatDate(info.getValue())}</span>,
    }),
  ];

  const fields = [
    { name: 'name', label: 'Company Name', placeholder: 'Acme Corp', type: 'text' },
    { name: 'industry', label: 'Industry', placeholder: 'SaaS, Retail, etc.', type: 'text' },
    { name: 'website', label: 'Website', placeholder: 'https://acme.com', type: 'text' },
    { name: 'email', label: 'Email', placeholder: 'hello@acme.com', type: 'email' },
    { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210', type: 'text' },
    { name: 'address.street', label: 'Street Address', placeholder: '123 Main Street', type: 'text' },
    { name: 'address.city', label: 'City', placeholder: 'Mumbai', type: 'text' },
    { name: 'size', label: 'Company Size', placeholder: '50-200 employees', type: 'text' },
    { name: 'revenue', label: 'Annual Revenue (₹)', placeholder: '10000000', type: 'number' },
  ];

  return (
    <ResourcePage
      title="Companies"
      description="Manage the organizations you work with, their contacts, deals, and revenue."
      queryKey={['companies']}
      listFn={api.companies.list}
      createFn={api.companies.create}
      updateFn={api.companies.update}
      deleteFn={api.companies.remove}
      columns={columns}
      fields={fields}
      emptyActionLabel="Add Company"
      emptyDescription="Add your first company to track relationships, contacts, and revenue."
    />
  );
}
