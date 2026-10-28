import { StyleSheet, View, type ViewProps } from 'react-native';
import { radii, spacing, type ThemeColors } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';
export function Card({ style, ...props }: ViewProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
 return <View {...props} style={[styles.card, style]} />; }
const createStyles = (colors: ThemeColors) => StyleSheet.create({ card: { backgroundColor: colors.surface, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, gap: spacing.md } });
