export const colors = {
  primary: '#1565C0', primaryActive: '#1E88E5', primaryDark: '#0B3D78', primaryFill: '#1565C0',
  teal: '#00897B', gold: '#FFB300', ink: '#1A1A2E', muted: '#52657D',
  background: '#F8F9FA', surface: '#FFFFFF', border: '#E0E0E0', paleBlue: '#EAF3FF',
  danger: '#B42318', dangerSurface: '#FFF1F0', success: '#086C60', successSurface: '#E5F6F1',
  white: '#FFFFFF', onDarkMuted: '#CCDFF6', disabled: '#E2E8F0',
} as const;
export type ThemeColors = { [Key in keyof typeof colors]: string };
export const darkColors: ThemeColors = {
  ...colors,
  primary: '#89BEFF', primaryActive: '#A9D0FF', primaryDark: '#091C32', primaryFill: '#155AA5',
  teal: '#5ED9C7', gold: '#FFC64D', ink: '#F1F4FA', muted: '#AFBED1',
  background: '#101722', surface: '#1A2534', border: '#3E4D61', paleBlue: '#20364F',
  danger: '#FFAAA2', dangerSurface: '#422624', success: '#75DEBF', successSurface: '#173D36',
  disabled: '#334154', onDarkMuted: '#C1D3E8',
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radii = { control: 12, card: 16 } as const;
export const fonts = {
  title: 'Poppins_600SemiBold', titleBold: 'Poppins_700Bold',
  body: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_700Bold',
} as const;
