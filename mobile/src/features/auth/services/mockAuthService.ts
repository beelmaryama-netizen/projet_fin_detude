import type { Session, User } from '../../../types/identity';
import { emailSchema, passwordSchema } from '../schemas/authSchemas';
import { AuthError, type AuthService, type Challenge, type VerificationPurpose } from '../types/auth';

export const DEMO_CODE = '123456';
export const DEMO_PASSWORD = 'MagicPro!2026';
const CODE_LIFETIME = 5 * 60_000;
const RESEND_DELAY = 30_000;
const MAX_ATTEMPTS = 5;
export interface Account { user: User; password: string; verified: boolean; mfa: boolean }
interface PendingChallenge { public: Challenge; accountId?: string; attempts: number }
interface MockOptions { latency?: number; now?: () => number; encode?: (password: string) => Promise<string>; verify?: (password: string, stored: string) => Promise<boolean> }
export interface MockAuthControls {
 snapshot: () => Promise<{ accounts: Account[]; sequence: number }>;
 restore: (data: { accounts: Account[]; sequence: number }) => void;
 configureAccess: (check: (user: User) => boolean) => void;
 updateEmployeeAccount: (admin: User, previousEmail: string, profile: Pick<User, "email" | "firstName" | "lastName" | "phone">) => void;
 provisionEmployee: (admin: User, employee: User, password: string) => Promise<void>;
}

/** In-memory simulator. Never use this service or its fixed OTP in production. */
export function createMockAuthService(options: MockOptions = {}): AuthService & MockAuthControls {
 let allowed = (_user: User) => true;
 const encode = options.encode ?? (async (password: string) => password);
 const matches = options.verify ?? (async (password: string, stored: string) => password === stored);
 const assertActive = (user: User) => { if (!allowed(user)) throw new AuthError('ACCOUNT_SUSPENDED', 'Ce compte est suspendu. Contactez MagicPro.'); };
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
    const user: User = { id: id('user'), firstName: role === 'CLIENT' ? 'Marie' : role === 'EMPLOYEE' ? 'Sarah' : 'Alex', lastName: 'Démo', email, role, ...(role === 'EMPLOYEE' ? { mustChangePassword: true } : {}) };
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
  const getAccount = (userId: string) => {
    const account = accounts.get(userId);
    if (!account) throw new AuthError('ACCOUNT_NOT_FOUND', 'Reconnectez-vous pour continuer.');
    assertActive(account.user); return account;
  };
  return {
    configureAccess: check => { allowed = check; },
    async snapshot() { for (const account of accounts.values()) if (account.password && !account.password.startsWith('sha256$')) account.password = await encode(account.password); return { accounts: JSON.parse(JSON.stringify([...accounts.values()])) as Account[], sequence }; },
    restore(data) { accounts.clear(); for (const account of data.accounts) accounts.set(account.user.id, account); sequence = data.sequence; challenges.clear(); resets.clear(); },
    updateEmployeeAccount(admin, previousEmail, profile) {
     if (getAccount(admin.id).user.role !== 'ADMIN') throw new AuthError('FORBIDDEN', 'Action réservée à l’administration.');
     const account = findByEmail(previousEmail.toLowerCase());
     const email = emailSchema.parse(profile.email);
     const duplicate = findByEmail(email);
     if (duplicate && duplicate !== account) throw new AuthError('EMAIL_EXISTS', 'Ce courriel est déjà utilisé.');
     if (!account) return; // Legacy directory entries do not yet have login credentials.
     if (account.user.role !== 'EMPLOYEE') throw new AuthError('FORBIDDEN', 'Ce compte n’est pas un compte employé.');
     account.user = { ...account.user, email, firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), phone: profile.phone?.trim() };
     for (const [key, pending] of challenges) if (pending.accountId === account.user.id) challenges.delete(key);
    },
    async provisionEmployee(admin, employee, password) {
     const actor = getAccount(admin.id); if (actor.user.role !== 'ADMIN' || employee.role !== 'EMPLOYEE') throw new AuthError('FORBIDDEN', 'Action réservée à l’administration.');
     if (findByEmail(emailSchema.parse(employee.email))) throw new AuthError('EMAIL_EXISTS', 'Ce courriel est déjà utilisé.');
     passwordSchema.parse(password); accounts.set(employee.id, { user: { ...employee, mustChangePassword: true }, password: await encode(password), verified: true, mfa: true });
    },
    async login(input) {
      await pause();
      const account = findByEmail(emailSchema.parse(input.email));
      if (!account || !(await matches(input.password, account.password))) {
        throw new AuthError('INVALID_CREDENTIALS', 'Le courriel ou le mot de passe est incorrect.');
      }
      assertActive(account.user);
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
      accounts.set(user.id, { user, password: await encode(input.password), verified: false, mfa: false });
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
      assertActive(account.user);
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
      account.password = await encode(password); account.user = { ...account.user, mustChangePassword: false };
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
      if (account.mfa) return { kind: 'verification', challenge: issue(account.user.email, 'login', account.user.id) };
      return { kind: 'authenticated', session: sessionFor(account) };
    },
    async logout() { await pause(); },
    async getProfile(userId) { await pause(); return { ...getAccount(userId).user }; },
    async updateProfile(userId, input) {
      await pause(); const account = getAccount(userId);
      if (!input.firstName.trim() || !input.lastName.trim()) throw new AuthError('INVALID_PROFILE', 'Vérifiez votre prénom et votre nom.');
      account.user = { ...account.user, firstName: input.firstName.trim(), lastName: input.lastName.trim(), phone: input.phone?.trim() };
      return { ...account.user };
    },
    async getSecurity(userId) { await pause(); const account = getAccount(userId); return { mfaEnabled: account.mfa, hasPassword: !!account.password }; },
    async changePassword(userId, currentPassword, password) {
      await pause(); const account = getAccount(userId);
      if (!account.password || !(await matches(currentPassword, account.password))) throw new AuthError('INVALID_PASSWORD', 'Le mot de passe actuel est incorrect ou ce compte utilise un fournisseur externe.');
      passwordSchema.parse(password); account.password = await encode(password); account.user = { ...account.user, mustChangePassword: false };
      for (const [key, value] of resets) if (value.accountId === userId) resets.delete(key);
      for (const [key, value] of challenges) if (value.accountId === userId) challenges.delete(key);
    },
    async setMfa(userId, enabled, currentPassword, code) {
      await pause(); const account = getAccount(userId);
      if ((account.password && !(await matches(currentPassword, account.password))) || code !== DEMO_CODE) throw new AuthError('INVALID_VERIFICATION', 'Vérifiez le mot de passe et le code de démonstration.');
      account.mfa = enabled;
    },
  };
}
