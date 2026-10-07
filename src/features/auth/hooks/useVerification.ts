import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../../../store/authStore';
import { codeSchema, resetPasswordSchema, type CodeForm, type ResetPasswordForm } from '../schemas/authSchemas';
import { authService } from '../services/authService';
import type { Challenge } from '../types/auth';
import { getAuthError } from './useAuthFlow';

const copy = {
  registration: { title: 'Vérifiez votre courriel', subtitle: 'Une dernière étape pour créer votre compte client.' },
  login: { title: 'Double authentification', subtitle: 'Confirmez votre identité pour accéder à votre compte.' },
  recovery: { title: 'Vérifiez votre accès', subtitle: 'Si un compte correspond à ce courriel, un code de vérification lui sera envoyé.' },
} as const;
export function useVerification(initialChallenge: Challenge) {
  const [challenge, setChallenge] = useState(initialChallenge);
  const [clock, setClock] = useState(Date.now());
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const setSession = useAuthStore(state => state.setSession);
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema), defaultValues: { code: '' }, mode: 'onTouched' });
  const passwordForm = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirmPassword: '' }, mode: 'onTouched' });
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const verify = useMutation({ mutationFn: ({ code }: CodeForm) => authService.verifyCode(challenge.id, code),
    onSuccess: result => {
      codeForm.reset();
      if (result.kind === 'authenticated') setSession(result.session);
      else setResetToken(result.resetToken);
    } });
  const resend = useMutation({ mutationFn: () => authService.resendCode(challenge.id), onSuccess: next => {
    setChallenge(next); setClock(Date.now()); codeForm.reset(); verify.reset(); setNotice('Un nouveau code a été demandé.');
  } });
  const reset = useMutation({ mutationFn: ({ password }: ResetPasswordForm) => {
    if (!resetToken) throw new Error('Missing reset verification');
    return authService.resetPassword(resetToken, password);
  }, onSuccess: () => {
    passwordForm.reset(); setResetToken(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login', params: { notice: 'Votre mot de passe a été mis à jour. Vous pouvez vous connecter.', email: challenge.email } }] });
  } });
  const busy = verify.isPending || resend.isPending || reset.isPending;
  const secondsUntilResend = Math.max(0, Math.ceil((challenge.resendAt - clock) / 1000));
  return {
    challenge, copy: copy[challenge.purpose], codeForm, passwordForm, resetToken,
    busy, verifyPending: verify.isPending, resendPending: resend.isPending, resetPending: reset.isPending,
    secondsUntilResend, expired: clock >= challenge.expiresAt,
    error: getAuthError(verify.error ?? resend.error ?? reset.error), notice,
    verifyCode: codeForm.handleSubmit(input => { resend.reset(); setNotice(undefined); verify.mutate(input); }),
    resendCode: () => { verify.reset(); setNotice(undefined); resend.mutate(); },
    resetPassword: passwordForm.handleSubmit(input => reset.mutate(input)),
    restart: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
  };
}
