import { useThemeStore } from '../store/themeStore';
import { getPalette } from './palette';

export function useAppTheme() {
  const mode = useThemeStore(state => state.mode);
  const toggleTheme = useThemeStore(state => state.toggleTheme);
  const isDark = mode === 'dark';

  return {
    mode,
    isDark,
    palette: getPalette(isDark),
    toggleTheme,
  };
}
