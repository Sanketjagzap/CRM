import {
  LayoutDashboard,
  Target,
  UsersRound,
  Building2,
  BriefcaseBusiness,
  Wallet,
  Package,
  CalendarDays,
  CheckSquare,
  PhoneCall,
  BarChart3,
  ShieldUser,
  Settings2,
  UserCog,
  ChevronRight,
} from 'lucide-react';

export const mainNavigation = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  {
    label: 'CRM',
    children: [
      { label: 'Leads', path: '/leads', icon: Target },
      { label: 'Contacts', path: '/contacts', icon: UsersRound },
      { label: 'Companies', path: '/companies', icon: Building2 },
      { label: 'Deals & Pipeline', path: '/deals', icon: BriefcaseBusiness },
    ],
  },
  {
    label: 'Finance',
    children: [
      { label: 'Revenue', path: '/revenue', icon: Wallet },
    ],
  },
  { label: 'Products & Services', path: '/products', icon: Package },
  {
    label: 'Activities',
    children: [
      { label: 'Tasks & Follow-ups', path: '/tasks', icon: CheckSquare },
      { label: 'Activities', path: '/activities', icon: PhoneCall },
    ],
  },
  { label: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
];

export const utilityNavigation = [
  { label: 'Users & Permissions', path: '/users', icon: UserCog, adminOnly: true },
  { label: 'Settings', path: '/settings', icon: Settings2 },
  { label: 'Profile', path: '/profile', icon: ShieldUser },
];

export const DEAL_STAGES = [
  { key: 'new_lead', label: 'New Lead', color: 'sky', probability: 10 },
  { key: 'qualified', label: 'Qualified', color: 'violet', probability: 30 },
  { key: 'proposal', label: 'Proposal', color: 'amber', probability: 50 },
  { key: 'negotiation', label: 'Negotiation', color: 'orange', probability: 75 },
  { key: 'won', label: 'Won', color: 'emerald', probability: 100 },
  { key: 'lost', label: 'Lost', color: 'rose', probability: 0 },
];

export const LEAD_STATUSES = [
  { value: 'new', label: 'New', tone: 'sky' },
  { value: 'contacted', label: 'Contacted', tone: 'violet' },
  { value: 'qualified', label: 'Qualified', tone: 'blue' },
  { value: 'proposal', label: 'Proposal', tone: 'amber' },
  { value: 'negotiation', label: 'Negotiation', tone: 'orange' },
  { value: 'won', label: 'Won', tone: 'emerald' },
  { value: 'lost', label: 'Lost', tone: 'rose' },
];

export const LEAD_SOURCES = ['website', 'referral', 'social_media', 'cold_call', 'email', 'event', 'advertisement', 'other'];
export const PRIORITIES = [
  { value: 'low', label: 'Low', tone: 'slate' },
  { value: 'medium', label: 'Medium', tone: 'sky' },
  { value: 'high', label: 'High', tone: 'amber' },
  { value: 'urgent', label: 'Urgent', tone: 'rose' },
];

export const TASK_STATUSES = [
  { value: 'todo', label: 'To-Do', tone: 'slate' },
  { value: 'in-progress', label: 'In Progress', tone: 'sky' },
  { value: 'done', label: 'Done', tone: 'emerald' },
  { value: 'cancelled', label: 'Cancelled', tone: 'zinc' },
];

export const TASK_CATEGORIES = [
  { value: 'task', label: 'Task' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'email', label: 'Email' },
];

export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'cheque', 'upi', 'online', 'other'];
export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', tone: 'amber' },
  { value: 'paid', label: 'Paid', tone: 'emerald' },
  { value: 'failed', label: 'Failed', tone: 'rose' },
  { value: 'refunded', label: 'Refunded', tone: 'slate' },
];

export { ChevronRight };
