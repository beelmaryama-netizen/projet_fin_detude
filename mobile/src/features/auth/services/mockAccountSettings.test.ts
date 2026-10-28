import { describe, it, expect } from 'vitest';
import { createMockAuthService, DEMO_PASSWORD, DEMO_CODE } from './mockAuthService';
describe('mock account settings', () => {
  it('updates the shared login identity, changes password and applies MFA on next login', async () => {
    const api = createMockAuthService({ latency: 0 }); const result = await api.login({ email: 'client@magicpro.demo', password: DEMO_PASSWORD });
    if (result.kind !== 'authenticated') throw new Error('Expected demo session');
    const id = result.session.user.id;
    await api.updateProfile(id, { firstName: 'Léa', lastName: 'Martin', phone: '5145550123' });
    await expect(api.changePassword(id, 'wrong', 'AnotherPass!2026')).rejects.toMatchObject({ code: 'INVALID_PASSWORD' });
    await api.changePassword(id, DEMO_PASSWORD, 'AnotherPass!2026');
    await expect(api.login({ email: 'client@magicpro.demo', password: DEMO_PASSWORD })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(api.setMfa(id, true, 'AnotherPass!2026', '000000')).rejects.toMatchObject({ code: 'INVALID_VERIFICATION' });
    await api.setMfa(id, true, 'AnotherPass!2026', DEMO_CODE);
    const login = await api.login({ email: 'client@magicpro.demo', password: 'AnotherPass!2026' });
    if (login.kind !== 'verification') throw new Error('Expected MFA');
    const verified = await api.verifyCode(login.challenge.id, DEMO_CODE);
    expect(verified.kind === 'authenticated' && verified.session.user.firstName).toBe('Léa');
    await api.setMfa(id, false, 'AnotherPass!2026', DEMO_CODE);
    expect((await api.login({ email: 'client@magicpro.demo', password: 'AnotherPass!2026' })).kind).toBe('authenticated');
  });
  it('reports provider accounts honestly and applies their simulated MFA', async () => {
    const api = createMockAuthService({ latency: 0 }); const login = await api.socialLogin('google');
    if (login.kind !== 'authenticated') throw new Error('Expected session');
    expect(await api.getSecurity(login.session.user.id)).toEqual({ hasPassword: false, mfaEnabled: false });
    await api.setMfa(login.session.user.id, true, '', DEMO_CODE);
    expect((await api.socialLogin('google')).kind).toBe('verification');
  });
});
