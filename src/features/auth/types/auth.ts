import type { Session } from '../../../types/identity';

export interface LoginInput { email: string; password: string }
// No role in this payload: registration is exclusively for clients.
export interface RegisterInput extends LoginInput {
  firstName: string;
  lastName: string;
  phone: string;
}
export type VerificationPurpose = 'registration' | 'login' | 'recovery';
export interface Challenge {
  id: string;
  email: string;
  purpose: VerificationPurpose;
  expiresAt: number;
  resendAt: number;
}
export type AuthResult =
  | { kind: 'authenticated'; session: Session }
  | { kind: 'verification'; challenge: Challenge };
export type VerificationResult =
  | { kind: 'authenticated'; session: Session }
  | { kind: 'recovery'; resetToken: string };
export type SocialProvider = 'google' | 'apple';

export interface AuthService {
  login(input: LoginInput): Promise<AuthResult>;
  register(input: RegisterInput): Promise<Challenge>;
  requestPasswordReset(email: string): Promise<Challenge>;
  verifyCode(challengeId: string, code: string): Promise<VerificationResult>;
  resendCode(challengeId: string): Promise<Challenge>;
  resetPassword(resetToken: string, password: string): Promise<void>;
  socialLogin(provider: SocialProvider): Promise<AuthResult>;
  logout(): Promise<void>;
}

export class AuthError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
