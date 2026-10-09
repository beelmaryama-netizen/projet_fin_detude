import type { Session, User } from '../../../types/identity';
import { emailSchema, passwordSchema } from '../schemas/authSchemas';
import { AuthError, type AuthService, type Challenge, type VerificationPurpose } from '../types/auth';

export const DEMO_CODE = '123456';
export const DEMO_PASSWORD = 'MagicPro!2026';
const CODE_LIFETIME = 5 * 60_000;
const RESEND_DELAY = 30_000;
const MAX_ATTEMPTS = 5;
interface Account { user: User; password: string; verified: boolean; mfa: boolean }
interface PendingChallenge { public: Challenge; accountId?: string; attempts: number }
interface MockOptions { latency?: number; now?: () => number }

/** In-memory simulator. Never use this service or its fixed OTP in production. */
export function createMockAuthService(options: MockOptions = {}): AuthService {
  const now = options.now ?? Date.now;
  const pause = () => new Promise<void>(resolve => setTimeout(resolve, options.latency ?? 550));
  const accounts = new Map<string, Account>();
  const challenges = new Map<string, PendingChallenge>();
  const resets = new Map<string, { accountId: string; expiresAt: number }>();
  let sequence = 0;
  const id = (prefix: string) => `mock-${prefix}-${++sequence}-${now()}`;
  const seeded: Array<[string, User['role'], boolean]> = [
    ['client@magicpro.demo', 'CLIENT', false],
    ['verification@magicpro.demo', 'CLIENT', true],
    ['employee@magicpro.demo', 'EMPLOYEE', true],
    ['admin@magicpro.demo', 'ADMIN', true],
  ];
  for (const [email, role, mfa] of seeded) {
    const user: User = { id: id('user'), firstName: role === 'CLIENT' ? 'Marie' : role === 'EMPLOYEE' ? 'Sarah' : 'Alex', lastName: 'Démo', email, role };
    accounts.set(user.id, { user, password: DEMO_PASSWORD, verified: true, mfa });
  }
  const findByEmail = (email: string) => [...accounts.values()].find(a => a.user.email === email);
  const sessionFor = (account: Account): Session => ({
    user: { ...account.user }, accessToken: id('access'), refreshToken: id('refresh'), expiresAt: now() + 15 * 60_000,
  });
  function issue(email: string, purpose: VerificationPurpose, accountId?: string): Challenge {
    // New requests invalidate previous codes for the same address and purpose.
    for (const [key, pending] of challenges) {
      if (pending.public.email === email && pending.public.purpose === purpose) challenges.delete(key);
    }
    const challenge: Challenge = { id: id('challenge'), email, purpose, expiresAt: now() + CODE_LIFETIME, resendAt: now() + RESEND_DELAY };
    challenges.set(challenge.id, { public: challenge, accountId, attempts: 0 });
    return { ...challenge };
  }
  function getChallenge(challengeId: string) {
    const pending = challenges.get(challengeId);
    if (!pending) throw new AuthError('INVALID_CHALLENGE', 'Cette vérification n’est plus disponible. Recommencez votre demande.');
    return pending;
  }
  return {
    async login(input) {
      await pause();
      const account = findByEmail(emailSchema.parse(input.email));
      if (!account || account.password !== input.password) {
        throw new AuthError('INVALID_CREDENTIALS', 'Le courriel ou le mot de passe est incorrect.');
      }
      if (!account.verified || account.mfa) return { kind: 'verification', challenge: issue(account.user.email, account.verified ? 'login' : 'registration', account.user.id) };
      return { kind: 'authenticated', session: sessionFor(account) };
    },
    async register(input) {
      await pause();
      const email = emailSchema.parse(input.email);
      if (findByEmail(email)) throw new AuthError('REGISTRATION_UNAVAILABLE', 'Impossible de créer ce compte. Essayez de vous connecter ou de récupérer votre accès.');
      passwordSchema.parse(input.password);
      // Explicit allowlist: even an unexpected runtime role property cannot grant privileges.
      const user: User = { id: id('user'), email, firstName: input.firstName.trim(), lastName: input.lastName.trim(), phone: input.phone.trim(), role: 'CLIENT' };
      accounts.set(user.id, { user, password: input.password, verified: false, mfa: false });
      return issue(email, 'registration', user.id);
    },
    async requestPasswordReset(rawEmail) {
      await pause();
      const email = emailSchema.parse(rawEmail);
      return issue(email, 'recovery', findByEmail(email)?.user.id);
    },
    async verifyCode(challengeId, code) {
      await pause();
      const pending = getChallenge(challengeId);
      if (now() >= pending.public.expiresAt) throw new AuthError('CODE_EXPIRED', 'Ce code a expiré. Demandez un nouveau code.');
      if (pending.attempts >= MAX_ATTEMPTS) throw new AuthError('TOO_MANY_ATTEMPTS', 'Trop de tentatives. Demandez un nouveau code.');
      pending.attempts++;
      const account = pending.accountId ? accounts.get(pending.accountId) : undefined;
      if (code !== DEMO_CODE || !account) throw new AuthError('INVALID_CODE', 'Ce code est invalide. Vérifiez les 6 chiffres.');
      challenges.delete(challengeId);
      if (pending.public.purpose === 'recovery') {
        const resetToken = id('reset');
        resets.set(resetToken, { accountId: account.user.id, expiresAt: now() + CODE_LIFETIME });
        return { kind: 'recovery', resetToken };
      }
      account.verified = true;
      return { kind: 'authenticated', session: sessionFor(account) };
    },
    async resendCode(challengeId) {
      await pause();
      const pending = getChallenge(challengeId);
      if (now() < pending.public.resendAt) throw new AuthError('RESEND_TOO_SOON', 'Patientez avant de demander un nouveau code.');
      return issue(pending.public.email, pending.public.purpose, pending.accountId);
    },
    async resetPassword(resetToken, password) {
      await pause();
      const ticket = resets.get(resetToken);
      if (!ticket || now() >= ticket.expiresAt) throw new AuthError('RESET_EXPIRED', 'La vérification a expiré. Recommencez la récupération.');
      passwordSchema.parse(password);
      const account = accounts.get(ticket.accountId);
      if (!account) throw new AuthError('RESET_EXPIRED', 'Recommencez la récupération.');
      account.password = password;
      for (const [key, value] of resets) if (value.accountId === ticket.accountId) resets.delete(key);
      for (const [key, value] of challenges) if (value.accountId === ticket.accountId) challenges.delete(key);
    },
    async socialLogin(provider) {
      await pause();
      const email = `${provider}@magicpro.demo`;
      let account = findByEmail(email);
      if (!account) {
        account = { user: { id: id('user'), email, firstName: 'Marie', lastName: 'Démo', role: 'CLIENT' }, password: '', verified: true, mfa: false };
        accounts.set(account.user.id, account);
      }
      return { kind: 'authenticated', session: sessionFor(account) };
    },
    async logout() { await pause(); },
  };
}
