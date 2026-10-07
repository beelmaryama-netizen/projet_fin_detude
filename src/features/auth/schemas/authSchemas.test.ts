import { describe, expect, it } from 'vitest';
import { codeSchema, loginSchema, passwordSchema, registerSchema } from './authSchemas';

describe('auth forms', () => {
  it('normalizes the email without altering an existing password', () => {
    expect(loginSchema.parse({ email: ' USER@example.ca ', password: ' secret ' })).toEqual({ email: 'user@example.ca', password: ' secret ' });
  });
  it('rejects invalid email and malformed verification codes', () => {
    expect(loginSchema.safeParse({ email: 'user', password: 'test' }).success).toBe(false);
    for (const code of ['', '12345', '1234567', '12x456', '１２３４５６']) expect(codeSchema.safeParse({ code }).success).toBe(false);
  });
  it('rejects password mismatch, empty names and malformed phone numbers', () => {
    const valid = { firstName: 'Léa', lastName: 'Martin', email: 'lea@example.ca', phone: '+1 (514) 555-0123', password: 'MagicPro!2026', confirmPassword: 'MagicPro!2026' };
    expect(registerSchema.safeParse(valid).success).toBe(true);
    for (const bad of [{ confirmPassword: 'different' }, { firstName: ' ' }, { phone: '123' }, { phone: 'call-me-5145550123' }]) {
      expect(registerSchema.safeParse({ ...valid, ...bad }).success).toBe(false);
    }
  });
  it('enforces a bounded password policy compatible with bcrypt bytes', () => {
    expect(passwordSchema.safeParse('MagicPro!2026').success).toBe(true);
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('É'.repeat(40) + 'a1!').success).toBe(false);
  });
});
