import { StyleSheet, Text, type TextProps } from 'react-native';
import { fonts, type ThemeColors } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption';
export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return <Text {...props} style={[styles.base, styles[variant], style]} />;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: { color: colors.ink, fontFamily: fonts.body },
  title: { fontFamily: fonts.titleBold, fontSize: 28, lineHeight: 36 },
  heading: { fontFamily: fonts.title, fontSize: 22, lineHeight: 30 },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 18 },
});
