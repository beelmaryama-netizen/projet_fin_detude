import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../schemas/clientSchemas';
import { profileService } from '../services/profileService';
import { useClientMutation } from './useClientData';
import { useAuthStore } from '../../../store/authStore';
import type { User } from '../../../types/identity';
import type { ProfileInput } from '../types/client';
export function useProfileForm(user: User) {
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' }, mode: 'onTouched' });
  const save = useClientMutation(profileService.save, updated => {
    const session = useAuthStore.getState().session;
    if (session?.user.id === updated.id) useAuthStore.getState().setSession({ ...session, user: updated });
    form.reset({ firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone ?? '' });
  });
  return { form, save, submit: form.handleSubmit(value => save.mutate(value)) };
}
