export const lightPalette = {
  primary: '#0968E8',
  primaryActive: '#1189FF',
  primaryDark: '#043B78',
  primaryDeep: '#022A59',
  accent: '#10BCEB',
  background: '#F4F8FC',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF5FE',
  text: '#071B3D',
  textSecondary: '#607493',
  border: '#D8E5F4',
  iconSoft: '#E8F3FF',
  success: '#0A9870',
  successSurface: '#E4F8F0',
  danger: '#D93B48',
  dangerSurface: '#FFF0F2',
  warning: '#D38A00',
  warningSurface: '#FFF6DC',
  white: '#FFFFFF',
  onDarkMuted: '#C5DCF7',
  shadow: '#062B59',
  tabBar: '#FFFFFF',
} as const;

export const darkPalette = {
  primary: '#2B8CFF',
  primaryActive: '#5EA8FF',
  primaryDark: '#062F61',
  primaryDeep: '#031A36',
  accent: '#27C8F2',
  background: '#06111F',
  surface: '#0C1D31',
  surfaceAlt: '#102845',
  text: '#F7FBFF',
  textSecondary: '#A9BED7',
  border: '#1B3A5D',
  iconSoft: '#112F51',
  success: '#47D1A5',
  successSurface: '#0C352F',
  danger: '#FF7A84',
  dangerSurface: '#3B1820',
  warning: '#FFC857',
  warningSurface: '#3A2A0A',
  white: '#FFFFFF',
  onDarkMuted: '#C5DCF7',
  shadow: '#000000',
  tabBar: '#081829',
} as const;

export function getPalette(isDark: boolean) {
  return isDark ? darkPalette : lightPalette;
}

export type AppPalette = ReturnType<typeof getPalette>;
