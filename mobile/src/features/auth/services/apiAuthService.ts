import { request, publicRequest, keepSession, resetApiSession, unavailable } from '../../../services/api/transport';
import type { AuthService, RegisterInput } from '../types/auth';
import type { Session, User } from '../../../types/identity';
import { useAuthStore } from '../../../store/authStore';
import { tokenStorage } from '../../../services/tokenStorage';
type AuthResponse = { user: User; accessToken: string; refreshToken: string };
async function authenticate(path: string, input: unknown) {
 const data = await publicRequest<AuthResponse>('POST', path, input);
 const session: Session = { ...data, expiresAt: Date.now() + 14 * 60000 };
 await keepSession(session); return { kind: 'authenticated' as const, session };
}
export const apiAuthService: Omit<AuthService, 'register'> & { register(input: RegisterInput): ReturnType<typeof authenticate> } = {
 login: input => authenticate('/auth/login', { email: input.email.trim().toLowerCase(), password: input.password }),
 register: ({ firstName, lastName, email, password, phone }) => authenticate('/auth/register', { firstName, lastName, email: email.trim().toLowerCase(), password, phone }),
 requestPasswordReset: async () => unavailable('Récupération du mot de passe'),
 verifyCode: async () => unavailable('Vérification par code'),
 resendCode: async () => unavailable('Renvoi du code'),
 resetPassword: async () => unavailable('Réinitialisation par code'),
 socialLogin: async () => unavailable('Connexion Google / Apple'),
 async logout() { const session = useAuthStore.getState().session; try { if (session) await publicRequest('POST', '/auth/logout', { refreshToken: session.refreshToken }); } finally { await resetApiSession(); } },
 getProfile: () => request<User>('GET', '/auth/me'),
 updateProfile: (_id, input) => request<User>('PATCH', '/users/me', input),
 getSecurity: async () => { const user = await request<User & { authProvider: string }>('GET', '/auth/me'); return { mfaEnabled: false, hasPassword: user.authProvider === 'LOCAL' }; },
 async changePassword(_id, currentPassword, newPassword) {
  const email = useAuthStore.getState().session?.user.email;
  await request('POST', '/auth/change-password', { currentPassword, newPassword });
  await resetApiSession();
  if (email) await authenticate('/auth/login', { email, password: newPassword });
 },
 setMfa: async () => unavailable('Double authentification'),
};
export async function restoreApiSession() {
 const refreshToken = await tokenStorage.read(); if (!refreshToken) return;
 try {
  const tokens = await publicRequest<{ accessToken: string; refreshToken: string }>('POST', '/auth/refresh', { refreshToken });
  // Store the rotated token before requesting the profile.
  await tokenStorage.write(tokens.refreshToken);
  const user = await request<User>('GET', '/auth/me', undefined, { headers: { Authorization: 'Bearer ' + tokens.accessToken } });
  await keepSession({ user, ...tokens, expiresAt: Date.now() + 14 * 60000 });
 } catch (error) { const status = error instanceof Error && 'status' in error ? error.status : 0; if (status === 401 || status === 403) await resetApiSession(); else throw error; }
}
