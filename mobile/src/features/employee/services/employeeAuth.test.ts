import { it, expect } from 'vitest';
import { createMockAuthService } from '../../auth/services/mockAuthService';
it('requires an initial employee password change and retains the employee role', async () => {
 const api = createMockAuthService({ latency: 0 });
 const login = await api.login({ email: 'employee@magicpro.demo', password: 'MagicPro!2026' });
 expect(login.kind).toBe('verification');
 if (login.kind !== 'verification') throw new Error('Expected MFA');
 const verified = await api.verifyCode(login.challenge.id, '123456');
 if (verified.kind !== 'authenticated') throw new Error('Expected session');
 const id = verified.session.user.id;
 expect(verified.session.user.mustChangePassword).toBe(true);
 await expect(api.changePassword(id, 'incorrect', 'NouveauMot!2026')).rejects.toThrow();
 expect((await api.getProfile(id)).mustChangePassword).toBe(true);
 await api.changePassword(id, 'MagicPro!2026', 'NouveauMot!2026');
 expect(await api.getProfile(id)).toMatchObject({ role: 'EMPLOYEE', mustChangePassword: false });
});
