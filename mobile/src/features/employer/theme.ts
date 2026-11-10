import { useAppTheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme/tokens';
// Compatibility names for the imported admin UI, all derived from the shared theme.
export function getEmployerTheme(colors: ThemeColors) {
 return { ...colors, backgroundDeep: colors.background, surfaceRaised: colors.paleBlue,
 text: colors.ink, blue: colors.primary };
}
export type EmployerTheme = ReturnType<typeof getEmployerTheme>;
export function useEmployerTheme(): EmployerTheme { return getEmployerTheme(useAppTheme().colors); }
