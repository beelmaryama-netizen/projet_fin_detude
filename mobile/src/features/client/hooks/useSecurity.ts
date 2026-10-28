import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useClientMutation, useClientQuery } from './useClientData';
import { profileService } from '../services/profileService';
import { changePasswordSchema, mfaSchema, type ChangePasswordInput, type MfaInput } from '../schemas/clientSchemas';
export function useSecurity() {
  const query = useClientQuery('security', profileService.security); const [mfaDialog, setMfaDialog] = useState(false);
  const passwordForm = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: '', password: '', confirmPassword: '' }, mode: 'onTouched' });
  const mfaForm = useForm<MfaInput>({ resolver: zodResolver(mfaSchema), defaultValues: { currentPassword: '', code: '' } });
  const password = useClientMutation(profileService.changePassword, () => passwordForm.reset());
  const mfa = useClientMutation((user, value: MfaInput) => profileService.setMfa(user, !query.data?.mfaEnabled, value.currentPassword, value.code), () => { mfaForm.reset(); setMfaDialog(false); });
  return { query, passwordForm, password, mfaForm, mfa, mfaDialog,
    openMfa: () => { mfa.reset(); mfaForm.reset(); setMfaDialog(true); }, closeMfa: () => { mfaForm.reset(); setMfaDialog(false); },
    changePassword: passwordForm.handleSubmit(value => password.mutate(value)),
    changeMfa: mfaForm.handleSubmit(value => {
      if (query.data?.hasPassword && !value.currentPassword) { mfaForm.setError('currentPassword', { message: 'Saisissez le mot de passe actuel.' }); return; }
      mfa.mutate(value);
    }),
  };
}
