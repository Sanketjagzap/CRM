import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { UserRound, Mail, Phone, DollarSign } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ResourcePage } from '../../components/crm/ResourcePage';
import { api } from '../../api/endpoints';
import { LEAD_SOURCES } from '../../constants/navigation';
import { formatCurrency, formatDate } from '../../lib/utils';

const columnHelper = createColumnHelper();

export default function Contacts() {
  const companiesQuery = useQuery({
    queryKey: ['companies', 'dropdown'],
    queryFn: async () => {
      const response = await api.companies.list({ limit: 100 });
      return response.data?.data || [];
    },
  });

  const companyOptions = (companiesQuery.data || []).map((c) => ({
    value: c._id || c.id,
    label: c.name,
  }));

  const columns = [
    columnHelper.accessor((row) => `${row.firstName || ''} ${row.lastName || ''}`.trim(), {
      id: 'name',
      header: 'Contact',
      cell: (info) => {
        const fullName = info.getValue() || 'Unnamed';
        const jobTitle = info.row.original.jobTitle;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 text-sky-300">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{fullName}</p>
              {jobTitle && (
                <p className="truncate text-xs text-slate-400">{jobTitle}</p>
              )}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-2 text-slate-300">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate max-w-[180px]">{info.getValue()}</span>
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
    columnHelper.accessor('company', {
      id: 'companyDisplay',
      header: 'Company',
      cell: (info) => {
        const contact = info.row.original;
        const company = contact.company;
        const companyName = typeof company === 'object' ? company?.name : company;
        if (companyName) {
          return <Badge tone="indigo">{companyName}</Badge>;
        }
        return <span className="text-slate-500">No company</span>;
      },
    }),
    columnHelper.accessor('totalRevenue', {
      header: 'Total Revenue',
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-medium text-emerald-300">{formatCurrency(info.getValue() || 0)}</span>
        </div>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => <span className="text-slate-400">{formatDate(info.getValue())}</span>,
    }),
  ];

  const fields = [
    { name: 'firstName', label: 'First Name', placeholder: 'e.g. John', type: 'text' },
    { name: 'lastName', label: 'Last Name', placeholder: 'e.g. Doe', type: 'text' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com' },
    { name: 'phone', label: 'Phone', placeholder: '+1 555 000 1234' },
    { name: 'mobile', label: 'Mobile', placeholder: '+1 555 000 5678' },
    { name: 'jobTitle', label: 'Job Title', placeholder: 'VP of Sales', type: 'text' },
    { name: 'department', label: 'Department', placeholder: 'Sales', type: 'text' },
    { name: 'website', label: 'Website', placeholder: 'https://company.com', type: 'text' },
    {
      name: 'companyId',
      label: 'Company',
      type: 'select',
      placeholder: 'Select a company',
      options: companyOptions,
    },
    {
      name: 'leadSource',
      label: 'Lead Source',
      type: 'select',
      placeholder: 'Select source',
      options: LEAD_SOURCES.map((s) => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '),
      })),
    },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { name: 'address.street', label: 'Address Line 1', placeholder: '123 Main St' },
    { name: 'address.city', label: 'City', placeholder: 'Mumbai' },
    { name: 'address.state', label: 'State', placeholder: 'Maharashtra' },
    { name: 'address.zip', label: 'Postal Code', placeholder: '400001' },
    { name: 'address.country', label: 'Country', placeholder: 'India' },
    { name: 'notesText', label: 'Notes', type: 'textarea', placeholder: 'Additional notes about this contact...' },
  ];

  return (
    <ResourcePage
      title="Contacts"
      description="Manage company relationships, communication logs, and activity history in one fast workspace."
      queryKey="contacts"
      listFn={api.contacts.list}
      createFn={api.contacts.create}
      updateFn={api.contacts.update}
      deleteFn={api.contacts.remove}
      columns={columns}
      fields={fields}
      emptyActionLabel="Add contact"
      emptyDescription="Capture the people behind each account and keep every conversation in context."
    />
  );
}
