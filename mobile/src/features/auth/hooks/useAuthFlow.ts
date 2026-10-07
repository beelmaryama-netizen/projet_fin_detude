import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../services/authService';
import { AuthError, type AuthResult, type SocialProvider } from '../types/auth';
import { forgotPasswordSchema, loginSchema, registerSchema, type ForgotPasswordForm, type LoginForm, type RegisterForm } from '../schemas/authSchemas';

export function getAuthError(error: Error | null): string | undefined {
  if (!error) return undefined;
  return error instanceof AuthError ? error.message : 'Une erreur est survenue. Réessayez dans quelques instants.';
}
function useAuthCompletion() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const setSession = useAuthStore(state => state.setSession);
  const complete = (result: AuthResult) => {
    if (result.kind === 'verification') navigation.navigate('Verification', { challenge: result.challenge });
    else setSession(result.session);
  };
  return { complete, navigation };
}
export function useLogin(initialEmail = '') {
  const { complete } = useAuthCompletion();
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: initialEmail, password: '' }, mode: 'onTouched' });
  const login = useMutation({ mutationFn: authService.login, onSuccess: result => { form.reset({ email: form.getValues('email'), password: '' }); complete(result); } });
  const social = useMutation({ mutationFn: authService.socialLogin, onSuccess: complete });
  return {
    form, busy: login.isPending || social.isPending, error: getAuthError(login.error ?? social.error),
    submit: form.handleSubmit(input => { social.reset(); login.mutate(input); }),
    socialLogin: (provider: SocialProvider) => { login.reset(); social.mutate(provider); },
    pendingProvider: social.isPending ? social.variables : undefined,
    loginPending: login.isPending,
  };
}
export function useRegistration() {
  const { complete, navigation } = useAuthCompletion();
  const form = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), mode: 'onTouched',
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' } });
  const register = useMutation({
    mutationFn: ({ confirmPassword: _confirmation, ...input }: RegisterForm) => authService.register(input),
    onSuccess: challenge => {
      form.reset({ ...form.getValues(), password: '', confirmPassword: '' });
      navigation.navigate('Verification', { challenge });
    },
  });
  const social = useMutation({ mutationFn: authService.socialLogin, onSuccess: complete });
  return {
    form, busy: register.isPending || social.isPending, registerPending: register.isPending,
    error: getAuthError(register.error ?? social.error),
    submit: form.handleSubmit(input => { social.reset(); register.mutate(input); }),
    socialLogin: (provider: SocialProvider) => { register.reset(); social.mutate(provider); },
    pendingProvider: social.isPending ? social.variables : undefined,
  };
}
export function useForgotPassword() {
  const { navigation } = useAuthCompletion();
  const form = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' }, mode: 'onTouched' });
  const request = useMutation({ mutationFn: ({ email }: ForgotPasswordForm) => authService.requestPasswordReset(email),
    onSuccess: challenge => navigation.navigate('Verification', { challenge }) });
  return { form, busy: request.isPending, error: getAuthError(request.error), submit: form.handleSubmit(input => request.mutate(input)) };
}
