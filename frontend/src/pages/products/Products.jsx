import { ResourcePage } from '../../components/crm/ResourcePage';
import { createColumnHelper } from '@tanstack/react-table';
import { Package, Tag, BarChart, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { formatCurrency } from '../../components/dashboard/DashboardWidgets';
import { api } from '../../api/endpoints';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

const columnHelper = createColumnHelper();

function ProductToggle({ productId, isActive }) {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: api.products.toggle,
    onSuccess: () => {
      toast.success('Product updated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggle.mutate(productId)}
      className={isActive ? 'text-emerald-300' : 'text-slate-400'}
    >
      {isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
    </Button>
  );
}

export default function Products() {
  const columns = [
    columnHelper.accessor('name', {
      header: 'Product / Service',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-300">
            <Package className="h-4 w-4" />
          </div>
          <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{info.getValue()}</p>
                <Badge
                  tone={
                    info.row.original.type === 'service'
                      ? 'violet'
                      : info.row.original.type === 'hybrid'
                        ? 'emerald'
                        : 'sky'
                  }
                >
                  {(info.row.original.type || 'product').charAt(0).toUpperCase() + (info.row.original.type || 'product').slice(1)}
                </Badge>
              </div>
            {info.row.original.description && (
              <p className="max-w-xs truncate text-xs text-slate-400">{info.row.original.description}</p>
            )}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-1.5 text-slate-300">
          <Tag className="h-3.5 w-3.5 text-slate-400" />
          <span>{info.getValue()}</span>
        </div>
      ) : <span className="text-slate-500">—</span>,
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: (info) => <span className="font-medium text-white">{formatCurrency(info.getValue() || 0)}</span>,
    }),
    columnHelper.accessor('taxRate', {
      header: 'Tax',
      cell: (info) => <Badge tone="amber">{info.getValue() || 0}%</Badge>,
    }),
    columnHelper.accessor('unitsSold', {
      header: 'Sold',
      cell: (info) => (
        <div className="flex items-center gap-1.5 text-slate-300">
          <BarChart className="h-3.5 w-3.5 text-slate-400" />
          <span>{info.getValue() || 0}</span>
        </div>
      ),
    }),
    columnHelper.accessor('totalRevenue', {
      header: 'Revenue',
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-medium text-emerald-300">{formatCurrency(info.getValue() || 0)}</span>
        </div>
      ),
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) => <ProductToggle productId={info.row.original._id || info.row.original.id} isActive={info.getValue() ?? true} />,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => <span className="text-slate-400">{formatDate(info.getValue())}</span>,
    }),
  ];

  const PRODUCT_TYPES = [
    { value: 'product', label: 'Product' },
    { value: 'service', label: 'Service' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const fields = [
    { name: 'name', label: 'Name', placeholder: 'Product or Service Name', type: 'text' },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      placeholder: 'Select type',
      options: PRODUCT_TYPES,
    },
    { name: 'category', label: 'Category', placeholder: 'Software, Consulting, Hardware', type: 'text' },
    { name: 'description', label: 'Description', placeholder: 'What does it offer?', type: 'textarea' },
    { name: 'sku', label: 'SKU / Code', placeholder: 'PROD-001', type: 'text' },
    { name: 'price', label: 'Price (₹)', placeholder: '9999', type: 'number' },
    { name: 'cost', label: 'Cost (₹)', placeholder: '5000', type: 'number' },
    { name: 'taxRate', label: 'Tax Rate (%)', placeholder: '18', type: 'number' },
    { name: 'discountRate', label: 'Default Discount (%)', placeholder: '0', type: 'number' },
    { name: 'stock', label: 'Stock Quantity', placeholder: '100', type: 'number' },
    { name: 'unit', label: 'Unit (unit/hour/day)', placeholder: 'unit', type: 'text' },
  ];

  return (
    <ResourcePage
      title="Products & Services"
      description="Catalog of offerings that you can attach to deals to compute revenue, discount, and tax."
      queryKey={['products']}
      listFn={api.products.list}
      createFn={api.products.create}
      updateFn={api.products.update}
      deleteFn={api.products.remove}
      columns={columns}
      fields={fields}
      emptyActionLabel="Add Product"
      emptyDescription="Create your first product or service to add them to deals."
    />
  );
}
