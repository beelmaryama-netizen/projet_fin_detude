import {
  request,
  publicRequest,
  keepSession,
  resetApiSession,
  unavailable,
  ApiError,
} from '../../../services/api/transport';
import type {
  AuthService,
  RegisterInput,
  Challenge,
  AuthResult,
  VerificationResult,
} from '../types/auth';
import type { Session, User } from '../../../types/identity';
import { useAuthStore } from '../../../store/authStore';
import { tokenStorage } from '../../../services/tokenStorage';
type AuthResponse = { user: User; accessToken: string; refreshToken: string };
type VerificationResponse = { kind: 'verification'; challenge: Challenge };
async function saveSession(
  data: AuthResponse,
): Promise<AuthResult & { kind: 'authenticated' }> {
  const session: Session = { ...data, expiresAt: Date.now() + 14 * 60000 };
  await keepSession(session);
  return { kind: 'authenticated', session };
}
async function authenticate(path: string, input: unknown): Promise<AuthResult> {
  const data = await publicRequest<AuthResponse | VerificationResponse>(
    'POST',
    path,
    input,
  );
  return 'challenge' in data ? data : saveSession(data);
}
const mfaChallenges = new Map<string, string>();
export async function requestApiMfa(
  userId: string,
  enabled: boolean,
  currentPassword: string,
) {
  const challenge = await request<Omit<Challenge, 'purpose'> & { purpose: 'mfa-setting' }>('POST', '/auth/mfa/challenge', {
    enabled,
    currentPassword,
  });
  mfaChallenges.set(userId + ':' + enabled, challenge.id);
  return challenge;
}
export async function completeSocialLogin(
  provider: 'google' | 'apple',
  input: {
    challengeId: string;
    idToken: string;
    firstName?: string;
    lastName?: string;
  },
) {
  return authenticate('/auth/social/' + provider, input);
}
export const apiAuthService: Omit<AuthService, 'register'> & {
  register(input: RegisterInput): Promise<AuthResult>;
} = {
  login: (input) =>
    authenticate('/auth/login', {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  register: ({ firstName, lastName, email, password, phone }) =>
    authenticate('/auth/register', {
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      password,
      phone,
    }),
  requestPasswordReset: (email) =>
    publicRequest<Challenge>('POST', '/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    }),
  async verifyCode(challengeId, code): Promise<VerificationResult> {
    const result = await publicRequest<
      AuthResponse | { kind: 'recovery'; resetToken: string }
    >('POST', '/auth/verify-code', { challengeId, code });
    return 'resetToken' in result ? result : saveSession(result);
  },
  resendCode: (challengeId) =>
    publicRequest<Challenge>('POST', '/auth/resend-code', { challengeId }),
  resetPassword: (resetToken, password) =>
    publicRequest<void>('POST', '/auth/reset-password', {
      resetToken,
      password,
    }),
  socialLogin: async () =>
    unavailable(
      'Connexion native Google / Apple : identifiants fournisseur requis',
    ),
  async logout() {
    const session = useAuthStore.getState().session;
    try {
      if (session)
        await publicRequest('POST', '/auth/logout', {
          refreshToken: session.refreshToken,
        });
    } finally {
      mfaChallenges.clear();
      await resetApiSession();
    }
  },
  getProfile: () => request<User>('GET', '/auth/me'),
  updateProfile: (_id, input) => request<User>('PATCH', '/users/me', input),
  getSecurity: () =>
    request<{ mfaEnabled: boolean; hasPassword: boolean }>(
      'GET',
      '/auth/security',
    ),
  async changePassword(_id, currentPassword, newPassword) {
    const email = useAuthStore.getState().session?.user.email;
    const security = await apiAuthService.getSecurity(_id);
    await request('POST', '/auth/change-password', {
      currentPassword,
      newPassword,
    });
    await resetApiSession();
    if (email && !security.mfaEnabled)
      await authenticate('/auth/login', { email, password: newPassword });
  },
  async setMfa(userId, enabled, _password, code) {
    const key = userId + ':' + enabled;
    const challengeId = mfaChallenges.get(key);
    if (!challengeId)
      throw new ApiError('Demandez d’abord un code de vérification.');
    await request('POST', '/auth/mfa/confirm', { challengeId, code });
    mfaChallenges.delete(key);
  },
};
export async function restoreApiSession() {
  const refreshToken = await tokenStorage.read();
  if (!refreshToken) return;
  try {
    const tokens = await publicRequest<{
      accessToken: string;
      refreshToken: string;
    }>('POST', '/auth/refresh', { refreshToken });
    await tokenStorage.write(tokens.refreshToken);
    const user = await request<User>('GET', '/auth/me', undefined, {
      headers: { Authorization: 'Bearer ' + tokens.accessToken },
    });
    await keepSession({ user, ...tokens, expiresAt: Date.now() + 14 * 60000 });
  } catch (error) {
    const status =
      error instanceof Error && 'status' in error ? error.status : 0;
    if (status === 401 || status === 403) await resetApiSession();
    else throw error;
  }
}
