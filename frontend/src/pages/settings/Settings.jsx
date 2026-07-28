import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Building2, Mail, Phone, Wallet, Percent, Tag, Palette, Bell, Lock, User, Sparkles, ChevronRight } from 'lucide-react';
import { api } from '../../api/endpoints';
import { Skeleton } from '../../components/common/Skeleton';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const SECTION_ICON = {
  company: Building2,
  currency: Wallet,
  tax: Percent,
  stages: Tag,
  notifications: Bell,
  password: Lock,
  profile: User,
};

export default function Settings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => (await api.settings.get()).data.data,
  });
  const profileQuery = useQuery({
    queryKey: ['settingsProfile'],
    queryFn: async () => (await api.settings.getProfile()).data.data,
  });

  const s = settingsQuery.data || {};
  const p = profileQuery.data || {};
  const loading = settingsQuery.isLoading;

  const { register: companyReg, handleSubmit: submitCompany, reset: resetCompany } = useForm({
    defaultValues: useMemo(() => ({
      company_name: s.company_name || '',
      company_email: s.company_email || '',
      company_phone: s.company_phone || '',
      company_address: s.company_address || '',
      website: s.website || '',
    }), [s]),
  });

  const { register: currencyReg, handleSubmit: submitCurrency } = useForm({
    defaultValues: { currency: s.currency || 'INR', currency_symbol: s.currency_symbol || '₹' },
  });

  const { register: taxReg, handleSubmit: submitTax } = useForm({
    defaultValues: { tax_rate: s.tax_rate ?? 18, tax_name: s.tax_name || 'GST' },
  });

  const { register: pwReg, handleSubmit: submitPw } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const updateSetting = useMutation({
    mutationFn: api.settings.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('Settings saved');
    },
  });

  const bulkMut = useMutation({
    mutationFn: (updates) => api.settings.updateBulk({ updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('Settings saved');
    },
  });

  const profileMut = useMutation({
    mutationFn: api.settings.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settingsProfile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Profile updated');
    },
  });

  const pwMut = useMutation({
    mutationFn: (payload) => api.settings.changePassword(payload),
    onSuccess: () => {
      toast.success('Password changed');
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to change password'),
  });

  const { register: profileReg, handleSubmit: submitProfile } = useForm({
    defaultValues: useMemo(() => ({
      name: p.name || '',
      phone: p.phone || '',
      title: p.title || '',
      department: p.department || '',
      avatar: p.avatar || '',
    }), [p]),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your company profile, taxes, currency, stages, notifications, password, and personal profile." />
      {loading ? (
        <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-80" /></div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardBody>
                <SectionHeading title="Company Profile" subtitle="Your organization details" icon={Building2} />
                <form className="grid gap-4 md:grid-cols-2" onSubmit={submitCompany((data) => bulkMut.mutate(data))}>
                  <Input label="Company Name" placeholder="Acme Corp" {...companyReg('company_name')} />
                  <Input label="Company Email" type="email" placeholder="contact@acme.com" {...companyReg('company_email')} />
                  <Input label="Phone" placeholder="+91 98765 43210" {...companyReg('company_phone')} />
                  <Input label="Website" placeholder="https://acme.com" {...companyReg('website')} />
                  <div className="md:col-span-2">
                    <Input label="Address" placeholder="Full street address" {...companyReg('company_address')} />
                  </div>
                  <div className="md:col-span-2"><Button type="submit" loading={bulkMut.isPending}>Save Company</Button></div>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Currency & Tax" subtitle="Default currency symbol and tax calculations" icon={Wallet} />
                <div className="grid gap-4 md:grid-cols-2">
                  <form className="contents" onSubmit={submitCurrency((data) => bulkMut.mutate(data))}>
                    <Input label="Currency Code (ISO)" placeholder="INR, USD, EUR" {...currencyReg('currency')} />
                    <Input label="Currency Symbol" placeholder="₹, $, €" {...currencyReg('currency_symbol')} />
                    <div className="md:col-span-2 mb-4"><Button type="submit" loading={bulkMut.isPending}>Save Currency</Button></div>
                  </form>
                  <form className="contents" onSubmit={submitTax((data) => bulkMut.mutate({ ...data, tax_rate: Number(data.tax_rate) }))}>
                    <Input label="Tax Name" placeholder="GST, VAT, Sales Tax" {...taxReg('tax_name')} />
                    <Input label="Default Tax Rate (%)" type="number" placeholder="18" {...taxReg('tax_rate')} />
                    <div className="md:col-span-2 mb-4"><Button type="submit" loading={bulkMut.isPending}>Save Tax</Button></div>
                  </form>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Pipeline Stages" subtitle="Opportunity stages with probabilities" icon={Tag} />
                <div className="space-y-2">
                  {(s.deal_stages || []).map((stage) => (
                    <div key={stage.key} className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/4 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg',
                          stage.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                          stage.color === 'rose' ? 'bg-rose-500/20 text-rose-300' :
                          stage.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                          stage.color === 'orange' ? 'bg-orange-500/20 text-orange-300' :
                          stage.color === 'violet' ? 'bg-violet-500/20 text-violet-300' :
                          'bg-sky-500/20 text-sky-300'
                        )}>
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white">{stage.label}</p>
                          <p className="text-xs text-slate-400 truncate">{stage.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone="sky">{stage.probability}%</Badge>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-400">Stages and colors can be customized by editing the deal_stages setting key.</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Notification Preferences" subtitle="Control how you are contacted" icon={Bell} />
                <form className="space-y-3" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  bulkMut.mutate({
                    notification_email: fd.get('notification_email') === 'on',
                    notification_push: fd.get('notification_push') === 'on',
                  });
                }}>
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/4 p-4">
                    <div>
                      <p className="font-medium text-white">Email notifications</p>
                      <p className="text-xs text-slate-400">Receive task reminders and important updates via email</p>
                    </div>
                    <input type="checkbox" name="notification_email" defaultChecked={s.notification_email ?? true} className="h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/4 p-4">
                    <div>
                      <p className="font-medium text-white">Push notifications</p>
                      <p className="text-xs text-slate-400">Get browser push notifications for follow-ups and deals</p>
                    </div>
                    <input type="checkbox" name="notification_push" defaultChecked={s.notification_push ?? true} className="h-4 w-4" />
                  </label>
                  <Button type="submit" loading={bulkMut.isPending}>Save Preferences</Button>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Change Password" subtitle="Keep your account secure" icon={Lock} />
                <form className="grid gap-4 md:grid-cols-2" onSubmit={submitPw((data) => {
                  if (data.newPassword !== data.confirmPassword) {
                    toast.error('New passwords do not match');
                    return;
                  }
                  pwMut.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword });
                })}>
                  <Input className="md:col-span-2" label="Current Password" type="password" {...pwReg('currentPassword')} />
                  <Input label="New Password" type="password" {...pwReg('newPassword')} />
                  <Input label="Confirm New Password" type="password" {...pwReg('confirmPassword')} />
                  <div className="md:col-span-2"><Button type="submit" loading={pwMut.isPending}>Update Password</Button></div>
                </form>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardBody>
                <SectionHeading title="My Profile" subtitle="Your personal workspace information" icon={User} />
                <form className="space-y-4" onSubmit={submitProfile((data) => profileMut.mutate(data))}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-violet-500 text-xl font-bold text-white shadow-lg shadow-cyan-500/20">
                      {(p.name || 'U').slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{p.name || 'User'}</p>
                      <p className="text-xs text-slate-400">{p.email || ''}</p>
                      {p.role && <Badge tone="violet" className="mt-1">{p.role}</Badge>}
                    </div>
                  </div>
                  <Input label="Full Name" {...profileReg('name')} />
                  <Input label="Job Title" {...profileReg('title')} />
                  <Input label="Department" {...profileReg('department')} />
                  <Input label="Phone" {...profileReg('phone')} />
                  <Input label="Avatar URL" {...profileReg('avatar')} />
                  <Button type="submit" loading={profileMut.isPending}>Save Profile</Button>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <SectionHeading title="Other Settings" subtitle="Key-value based customizable options" icon={Palette} />
                <div className="space-y-3 text-sm">
                  <Row label="Lead Statuses" values={s.lead_statuses || []} />
                  <Row label="Lead Sources" values={s.lead_sources || []} />
                  <Row label="Lead Priorities" values={s.lead_priorities || []} />
                  <Row label="Payment Methods" values={s.payment_methods || []} />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/10 text-cyan-300 ring-1 ring-cyan-400/15">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function Row({ label, values }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/6 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <div className="flex flex-wrap justify-end gap-1.5">
        {values.map((v) => (
          <Badge key={v} tone="sky">{v}</Badge>
        ))}
        {values.length === 0 && <span className="text-slate-500">—</span>}
      </div>
    </div>
  );
}
