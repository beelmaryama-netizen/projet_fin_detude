import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, darkColors, type ThemeColors } from './tokens';
import { isDarkAppearance, validPreference, type ThemePreference } from './appearance';

const storageKey = 'magicpro.appearance';
interface ThemeContextValue { colors: ThemeColors; dark: boolean; preference: ThemePreference; setPreference: (value: ThemePreference) => void; error?: string }
const ThemeContext = createContext<ThemeContextValue | null>(null);
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, updatePreference] = useState<ThemePreference>('system');
  const [error, setError] = useState<string>();
  const edited = useRef(false);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    const read = async () => {
      try {
        const saved = Platform.OS === 'web' ? globalThis.localStorage?.getItem(storageKey) ?? null : await SecureStore.getItemAsync(storageKey);
        if (active && !edited.current && validPreference(saved)) updatePreference(saved);
      } catch { if (active) setError('Le réglage d’apparence enregistré n’a pas pu être chargé.'); }
    };
    void read(); return () => { active = false; };
  }, []);
  const setPreference = (value: ThemePreference) => {
    edited.current = true; updatePreference(value); setError(undefined);
    writes.current = writes.current.then(async () => {
      try {
        if (Platform.OS === 'web') globalThis.localStorage.setItem(storageKey, value);
        else await SecureStore.setItemAsync(storageKey, value);
      } catch { setError('L’apparence est appliquée, mais n’a pas pu être enregistrée sur cet appareil.'); }
    });
  };
  const dark = isDarkAppearance(preference, system);
  return <ThemeContext.Provider value={{ colors: dark ? darkColors : colors, dark, preference, setPreference, error }}>{children}</ThemeContext.Provider>;
}
export function useAppTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('ThemeProvider is required.');
  return theme;
}
