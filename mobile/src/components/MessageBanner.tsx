import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radii, spacing, type ThemeColors } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

export function MessageBanner({ message, tone = 'error' }: { message?: string; tone?: 'error' | 'success' | 'info' }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  if (!message) return null;
  const tint = tone === 'error' ? colors.danger : tone === 'success' ? colors.success : colors.primary;
  return <View accessibilityLiveRegion="polite" accessibilityRole={tone === 'error' ? 'alert' : undefined}
    style={[styles.box, { backgroundColor: tone === 'error' ? colors.dangerSurface : tone === 'success' ? colors.successSurface : colors.paleBlue }]}>
    <Ionicons name={tone === 'error' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'} size={22} color={tint} accessible={false} />
    <AppText variant="label" style={[styles.text, { color: tint }]}>{message}</AppText>
  </View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  box: { flexDirection: 'row', gap: spacing.sm, borderRadius: radii.control, padding: spacing.md, alignItems: 'flex-start' },
  text: { flex: 1 },
});
