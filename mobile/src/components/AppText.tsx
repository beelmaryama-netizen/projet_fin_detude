import { StyleSheet, Text, type TextProps } from 'react-native';
import { fonts } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption';

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  const { palette } = useAppTheme();
  return <Text {...props} style={[styles.base, { color: palette.text }, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  base: { fontFamily: fonts.body },
  title: { fontFamily: fonts.titleBold, fontSize: 28, lineHeight: 36 },
  heading: { fontFamily: fonts.title, fontSize: 22, lineHeight: 30 },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 18 },
});
