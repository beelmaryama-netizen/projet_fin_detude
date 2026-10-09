import { describe, expect, it } from 'vitest';
import { createMockAuthService, DEMO_CODE, DEMO_PASSWORD } from './mockAuthService';
import type { RegisterInput } from '../types/auth';

const newClient: RegisterInput = { firstName: 'Léa', lastName: 'Martin', email: 'lea@example.ca', phone: '5145550123', password: DEMO_PASSWORD };
const makeService = () => createMockAuthService({ latency: 0 });

describe('mock authentication contract', () => {
  it('registers only CLIENT, even when a runtime caller injects an ADMIN role', async () => {
    const api = makeService();
    const maliciousPayload = { ...newClient, role: 'ADMIN' };
    const challenge = await api.register(maliciousPayload);
    expect(challenge.purpose).toBe('registration');
    const result = await api.verifyCode(challenge.id, DEMO_CODE);
    expect(result.kind).toBe('authenticated');
    if (result.kind === 'authenticated') expect(result.session.user.role).toBe('CLIENT');
    await expect(api.verifyCode(challenge.id, DEMO_CODE)).rejects.toMatchObject({ code: 'INVALID_CHALLENGE' });
  });
  it('requires verification for an unverified registered account', async () => {
    const api = makeService();
    await api.register(newClient);
    expect(await api.login(newClient)).toMatchObject({ kind: 'verification', challenge: { purpose: 'registration' } });
  });
  it('normalizes email and rejects duplicate registration', async () => {
    const api = makeService();
    await api.register({ ...newClient, email: ' LEA@example.ca ' });
    await expect(api.register(newClient)).rejects.toMatchObject({ code: 'REGISTRATION_UNAVAILABLE' });
  });
  it('authenticates the ordinary client without unnecessary MFA', async () => {
    const result = await makeService().login({ email: ' CLIENT@magicpro.demo ', password: DEMO_PASSWORD });
    expect(result).toMatchObject({ kind: 'authenticated', session: { user: { role: 'CLIENT' } } });
  });
  it.each([['employee@magicpro.demo', 'EMPLOYEE'], ['admin@magicpro.demo', 'ADMIN']])('preserves the seeded role for %s after MFA', async (email, role) => {
    const api = makeService();
    const result = await api.login({ email, password: DEMO_PASSWORD });
    expect(result.kind).toBe('verification');
    if (result.kind === 'verification') {
      expect(await api.verifyCode(result.challenge.id, DEMO_CODE)).toMatchObject({ kind: 'authenticated', session: { user: { role } } });
    }
  });
  it('uses the same invalid-credentials error for absent users and wrong passwords', async () => {
    const api = makeService();
    for (const email of ['client@magicpro.demo', 'absent@example.ca']) {
      await expect(api.login({ email, password: 'wrong' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    }
  });
  it('rejects wrong codes and blocks after five attempts', async () => {
    const api = makeService();
    const challenge = await api.register(newClient);
    for (let i = 0; i < 5; i++) await expect(api.verifyCode(challenge.id, '000000')).rejects.toMatchObject({ code: 'INVALID_CODE' });
    await expect(api.verifyCode(challenge.id, DEMO_CODE)).rejects.toMatchObject({ code: 'TOO_MANY_ATTEMPTS' });
  });
  it('expires codes and enforces resend cooldown while invalidating the old challenge', async () => {
    let time = 1000;
    const api = createMockAuthService({ latency: 0, now: () => time });
    const original = await api.register(newClient);
    await expect(api.resendCode(original.id)).rejects.toMatchObject({ code: 'RESEND_TOO_SOON' });
    time += 300_000;
    await expect(api.verifyCode(original.id, DEMO_CODE)).rejects.toMatchObject({ code: 'CODE_EXPIRED' });
    const replacement = await api.resendCode(original.id);
    await expect(api.verifyCode(original.id, DEMO_CODE)).rejects.toMatchObject({ code: 'INVALID_CHALLENGE' });
    expect(await api.verifyCode(replacement.id, DEMO_CODE)).toMatchObject({ kind: 'authenticated' });
  });
  it('returns the same recovery challenge shape for known and unknown addresses', async () => {
    const api = makeService();
    const known = await api.requestPasswordReset('client@magicpro.demo');
    const unknown = await api.requestPasswordReset('absent@example.ca');
    expect(Object.keys(known)).toEqual(Object.keys(unknown));
    expect(unknown.purpose).toBe('recovery');
    await expect(api.verifyCode(unknown.id, DEMO_CODE)).rejects.toMatchObject({ code: 'INVALID_CODE' });
  });
  it('recovers a password without signing in, and consumes the recovery ticket once', async () => {
    const api = makeService();
    const challenge = await api.requestPasswordReset('client@magicpro.demo');
    const result = await api.verifyCode(challenge.id, DEMO_CODE);
    expect(result.kind).toBe('recovery');
    if (result.kind === 'recovery') {
      await api.resetPassword(result.resetToken, 'NouveauPass!2026');
      await expect(api.resetPassword(result.resetToken, 'NouveauPass!2027')).rejects.toMatchObject({ code: 'RESET_EXPIRED' });
      await expect(api.login({ email: challenge.email, password: DEMO_PASSWORD })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
      expect(await api.login({ email: challenge.email, password: 'NouveauPass!2026' })).toMatchObject({ kind: 'authenticated' });
    }
  });
  it('expires password reset tickets', async () => {
    let time = 0;
    const api = createMockAuthService({ latency: 0, now: () => time });
    const challenge = await api.requestPasswordReset('client@magicpro.demo');
    const result = await api.verifyCode(challenge.id, DEMO_CODE);
    if (result.kind !== 'recovery') throw new Error('Expected recovery result');
    time = 300_001;
    await expect(api.resetPassword(result.resetToken, 'NouveauPass!2026')).rejects.toMatchObject({ code: 'RESET_EXPIRED' });
  });
  it.each(['google', 'apple'] as const)('simulates %s as a client without real OAuth', async provider => {
    expect(await makeService().socialLogin(provider)).toMatchObject({ kind: 'authenticated', session: { user: { role: 'CLIENT' } } });
  });
});
