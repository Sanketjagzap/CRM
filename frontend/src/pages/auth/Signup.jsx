import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardBody } from '../../components/ui/card';
import { toast } from 'react-hot-toast';

export default function Signup() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { register, handleSubmit } = useForm({ defaultValues: { name: '', email: '', password: '', role: 'sales' } });

  const signup = useMutation({
    mutationFn: api.auth.register,
    onSuccess: (response) => {
      clearSession();
      toast.success('Account created. Now sign in with the new account.');
      navigate('/login', { replace: true });
    },
    onError: () => toast.error('Signup failed'),
  });

  return (
    <div className="mesh grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardBody className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white">Create account</h2>
          <p className="mt-2 text-sm text-slate-300">Start your CRM workspace.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => signup.mutate(values))}>
            <Input placeholder="Full name" {...register('name')} />
            <Input placeholder="Email" type="email" {...register('email')} />
            <Input placeholder="Password" type="password" {...register('password')} />
            <select
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              {...register('role')}
            >
              <option value="sales">Sales</option>
              <option value="manager">Manager</option>
              <option value="support">Support</option>
            </select>
            <Button type="submit" className="w-full">Create account</Button>
          </form>
          <p className="mt-5 text-sm text-slate-300">Already have an account? <Link className="text-white" to="/login">Sign in</Link></p>
        </CardBody>
      </Card>
    </div>
  );
}