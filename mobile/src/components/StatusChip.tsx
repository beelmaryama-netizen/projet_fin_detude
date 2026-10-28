import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { radii, spacing, type ThemeColors } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';
export function StatusChip({ label, tone = 'info' }: { label: string; tone?: 'info' | 'success' | 'muted' }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return <View style={[styles.chip, { backgroundColor: tone === 'success' ? colors.successSurface : tone === 'muted' ? colors.background : colors.paleBlue }]}><AppText variant="caption" style={{ color: tone === 'success' ? colors.success : tone === 'muted' ? colors.muted : colors.primary }}>{label}</AppText></View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({ chip: { alignSelf: 'flex-start', borderRadius: radii.control, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm } });
