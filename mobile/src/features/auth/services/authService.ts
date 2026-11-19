import { apiMode } from '../../../services/api/config';
import { apiAuthService } from './apiAuthService';
import {
  encodeLocalPassword,
  verifyLocalPassword,
} from '../../../services/localCredentials';
import { createMockAuthService } from './mockAuthService';
import type { AuthService } from '../types/auth';

// Explicit choice between the Express API adapter and the isolated demo service.
const demoAuthService = createMockAuthService({
  encode: encodeLocalPassword,
  verify: verifyLocalPassword,
});
export const authService = apiMode
  ? { ...demoAuthService, ...apiAuthService }
  : demoAuthService;
