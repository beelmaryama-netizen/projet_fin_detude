export type ThemePreference = 'system' | 'light' | 'dark';
export const validPreference = (value: string | null): value is ThemePreference => value === 'system' || value === 'light' || value === 'dark';
export const isDarkAppearance = (preference: ThemePreference, system: string | null | undefined) => preference === 'dark' || (preference === 'system' && system === 'dark');
