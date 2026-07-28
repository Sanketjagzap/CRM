import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { api } from '../../api/endpoints';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.auth.me();
      reset(response.data.data || {});
      return response.data.data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: api.profile.update,
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Update your identity, contact details, and avatar for a polished workspace presence." />
      <Card>
        <CardBody>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => updateProfile.mutate(values))}>
            <Input placeholder="Name" {...register('name')} />
            <Input placeholder="Email" disabled {...register('email')} />
            <Input placeholder="Phone" {...register('phone')} />
            <Input placeholder="Title" {...register('title')} />
            <div className="md:col-span-2"><Button type="submit">Save profile</Button></div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}