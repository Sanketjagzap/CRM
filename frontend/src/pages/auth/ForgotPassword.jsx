import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardBody } from '../../components/ui/card';
import { toast } from 'react-hot-toast';

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm();

  const requestReset = useMutation({
    mutationFn: api.auth.forgotPassword,
    onSuccess: (response) => toast.success(response.data.message || 'Reset instructions sent'),
  });

  return (
    <div className="mesh grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardBody className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white">Forgot password</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => requestReset.mutate(values))}>
            <Input placeholder="Email" type="email" {...register('email')} />
            <Button type="submit" className="w-full">Send reset link</Button>
          </form>
          <p className="mt-5 text-sm text-slate-300"><Link className="text-white" to="/login">Back to login</Link></p>
        </CardBody>
      </Card>
    </div>
  );
}