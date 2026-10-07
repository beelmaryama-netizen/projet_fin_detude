import { createMockAuthService } from './mockAuthService';
import type { AuthService } from '../types/auth';

// Single replacement point for the future NestJS adapter. No HTTP request in mock mode.
export const authService: AuthService = createMockAuthService();
