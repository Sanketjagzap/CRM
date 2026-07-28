import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { CheckSquare, Clock, Link, AlertTriangle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ResourcePage } from '../../components/crm/ResourcePage';
import { api } from '../../api/endpoints';
import { TASK_STATUSES, TASK_CATEGORIES, PRIORITIES } from '../../constants/navigation';
import { formatDate, formatDateTime } from '../../lib/utils';

const columnHelper = createColumnHelper();

const CATEGORY_TONES = {
  task: 'slate',
  follow_up: 'sky',
  call: 'violet',
  meeting: 'slate',
  email: 'sky',
};

const ENTITY_TONES = {
  lead: 'sky',
  contact: 'violet',
  company: 'slate',
  deal: 'emerald',
};

const ENTITY_LABELS = {
  lead: 'Lead',
  contact: 'Contact',
  company: 'Company',
  deal: 'Deal',
};

function toneForStatus(status) {
  const match = TASK_STATUSES.find((s) => s.value === status);
  return match?.tone || 'slate';
}

function labelForStatus(status) {
  const match = TASK_STATUSES.find((s) => s.value === status);
  return match?.label || status;
}

function toneForCategory(category) {
  return CATEGORY_TONES[category] || 'slate';
}

function labelForCategory(category) {
  const match = TASK_CATEGORIES.find((c) => c.value === category);
  return match?.label || category;
}

function toneForPriority(priority) {
  const match = PRIORITIES.find((p) => p.value === priority);
  return match?.tone || 'slate';
}

function labelForPriority(priority) {
  const match = PRIORITIES.find((p) => p.value === priority);
  return match?.label || priority;
}

export default function Tasks() {
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Task',
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 text-sky-300">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{info.getValue()}</p>
              {info.row.original.description ? (
                <p className="truncate text-xs text-slate-400">{info.row.original.description}</p>
              ) : null}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge tone={toneForStatus(info.getValue())}>{labelForStatus(info.getValue())}</Badge>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => (
          info.getValue() ? (
            <Badge tone={toneForCategory(info.getValue())}>{labelForCategory(info.getValue())}</Badge>
          ) : <span className="text-slate-500">—</span>
        ),
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: (info) => (
          info.getValue() ? (
            <Badge tone={toneForPriority(info.getValue())}>{labelForPriority(info.getValue())}</Badge>
          ) : <span className="text-slate-500">—</span>
        ),
      }),
      columnHelper.accessor('dueDate', {
        header: 'Due Date',
        cell: (info) => {
          const date = info.getValue();
          const isOverdue = info.row.original.isOverdue;
          if (!date) return <span className="text-slate-500">—</span>;
          return (
            <div className="flex items-center gap-2">
              <span className="text-slate-300">{formatDate(date)}</span>
              {isOverdue && (
                <Badge tone="rose">
                  <AlertTriangle className="mr-1 h-3 w-3 inline-block" />
                  Overdue
                </Badge>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('followUpAt', {
        header: 'Follow-up',
        cell: (info) => (
          info.getValue() ? (
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatDateTime(info.getValue())}</span>
            </div>
          ) : <span className="text-slate-500">—</span>
        ),
      }),
      columnHelper.accessor('entityType', {
        header: 'Linked Entity',
        cell: (info) => {
          const entityType = info.getValue();
          const entityId = info.row.original.entityId;
          if (entityType && entityId) {
            return (
              <Badge tone={ENTITY_TONES[entityType] || 'neutral'}>
                <Link className="mr-1 h-3 w-3 inline-block" />
                {ENTITY_LABELS[entityType] || entityType}
              </Badge>
            );
          }
          return <span className="text-slate-500">—</span>;
        },
      }),
    ],
    []
  );

  const fields = useMemo(
    () => [
      { name: 'title', label: 'Title', placeholder: 'e.g. Follow up with Acme Corp', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Add context, details, and checklist items' },
      { name: 'category', label: 'Category', type: 'select', options: TASK_CATEGORIES, placeholder: 'Select a category' },
      { name: 'status', label: 'Status', type: 'select', options: TASK_STATUSES, placeholder: 'Select a status' },
      { name: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, placeholder: 'Select a priority' },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'followUpAt', label: 'Follow-up Date & Time', type: 'datetime-local' },
      { name: 'reminder', label: 'Set Reminder', type: 'checkbox', placeholder: 'Enable reminder notification' },
      {
        name: 'entityType',
        label: 'Linked Entity Type',
        type: 'select',
        options: [
          { value: 'lead', label: 'Lead' },
          { value: 'contact', label: 'Contact' },
          { value: 'company', label: 'Company' },
          { value: 'deal', label: 'Deal' },
        ],
        placeholder: 'Select entity type',
      },
      { name: 'entityId', label: 'Linked Entity ID', placeholder: 'Paste or enter the entity ID' },
      { name: 'outcome', label: 'Outcome', type: 'textarea', placeholder: 'Describe the outcome (for completed tasks)' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional notes or context' },
    ],
    []
  );

  return (
    <ResourcePage
      title="Tasks"
      description="Track due dates, reminders, follow-ups, and status updates across leads, contacts, companies, and deals."
      queryKey="tasks"
      listFn={api.tasks.list}
      createFn={api.tasks.create}
      updateFn={api.tasks.update}
      deleteFn={api.tasks.remove}
      columns={columns}
      fields={fields}
      emptyActionLabel="Create Task"
      emptyDescription="Define next actions to keep the pipeline moving and keep reminders visible to the team."
    />
  );
}
