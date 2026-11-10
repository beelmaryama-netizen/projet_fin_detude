import { apiMode } from '../../../services/api/config';
import { apiAuthService } from './apiAuthService';
import { encodeLocalPassword, verifyLocalPassword } from '../../../services/localCredentials';
import { createMockAuthService } from './mockAuthService';
import type { AuthService } from '../types/auth';

// Single replacement point for the future NestJS adapter. No HTTP request in mock mode.
const demoAuthService = createMockAuthService({ encode: encodeLocalPassword, verify: verifyLocalPassword });
export const authService = apiMode ? { ...demoAuthService, ...apiAuthService } : demoAuthService;
