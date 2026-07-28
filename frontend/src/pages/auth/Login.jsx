import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import { api } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardBody } from '../../components/ui/card';
import { toast } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { register, handleSubmit } = useForm({ defaultValues: { email: 'admin@crm.local', password: 'password123' } });

  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (response) => {
      const data = response.data.data;
      setSession({ user: data, accessToken: response.data.accessToken });
      toast.success('Welcome back');
      navigate('/dashboard');
    },
    onError: () => toast.error('Login failed'),
  });

  return (
    <div className="mesh grid min-h-screen place-items-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-glass backdrop-blur-xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden p-8 lg:flex">
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-3 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Modern AI CRM</p>
                <h1 className="text-xl font-semibold">Premium operations cockpit</h1>
              </div>
            </div>
            <p className="max-w-lg text-sm leading-7 text-slate-300">Track leads, build pipelines, close revenue, and manage service workflows from one polished, realtime workspace built for high-performance sales teams.</p>
          </div>
          <div className="relative z-10 grid gap-4 sm:grid-cols-2">
            {['Realtime notifications', 'Glassmorphism dashboard', 'Advanced analytics', 'Optimized pipeline flow'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{item}</div>)}
          </div>
        </div>

        <Card className="border-0 bg-transparent shadow-none">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3 text-white lg:hidden"><Shield className="h-5 w-5 text-cyan-300" /><span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Modern AI CRM</span></div>
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
            <p className="mt-2 text-sm text-slate-300">Access your sales cockpit and collaborative pipeline.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => login.mutate(values))}>
              <Input placeholder="Email" type="email" {...register('email')} />
              <Input placeholder="Password" type="password" {...register('password')} />
              <Button type="submit" className="w-full">Enter workspace</Button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
              <Link to="/forgot-password" className="hover:text-white">Forgot password?</Link>
              <Link to="/signup" className="hover:text-white">Create account</Link>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}