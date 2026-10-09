import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'magicpro.refresh-token';
// Future API adapter: refresh token only, access token stays in memory.
// Web preview deliberately has no persistent token storage.
export const tokenStorage = {
  async read(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async write(refreshToken: string): Promise<void> {
    if (Platform.OS === 'web') return;
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  },
  async clear(): Promise<void> {
    if (Platform.OS === 'web') return;
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
