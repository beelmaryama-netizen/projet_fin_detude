import { authService } from '../../auth/services/authService';
import { profileSchema, changePasswordSchema } from '../schemas/clientSchemas';
import type { ProfileInput } from '../types/client';
import type { ChangePasswordInput } from '../schemas/clientSchemas';
import type { User } from '../../../types/identity';
export const profileService = {
  get: (user: User) => authService.getProfile(user.id),
  save: (user: User, input: ProfileInput) => authService.updateProfile(user.id, profileSchema.parse(input)),
  security: (user: User) => authService.getSecurity(user.id),
  changePassword: (user: User, input: ChangePasswordInput) => { const valid = changePasswordSchema.parse(input); return authService.changePassword(user.id, valid.currentPassword, valid.password); },
  setMfa: (user: User, enabled: boolean, password: string, code: string) => authService.setMfa(user.id, enabled, password, code),
};
