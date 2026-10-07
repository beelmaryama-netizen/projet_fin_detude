import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radii, spacing } from '../theme/tokens';
import { AppText } from './AppText';

export function MessageBanner({ message, tone = 'error' }: { message?: string; tone?: 'error' | 'success' | 'info' }) {
  if (!message) return null;
  const tint = tone === 'error' ? colors.danger : tone === 'success' ? colors.success : colors.primary;
  return <View accessibilityLiveRegion="polite" accessibilityRole={tone === 'error' ? 'alert' : undefined}
    style={[styles.box, { backgroundColor: tone === 'error' ? colors.dangerSurface : tone === 'success' ? colors.successSurface : colors.paleBlue }]}>
    <Ionicons name={tone === 'error' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'} size={22} color={tint} accessible={false} />
    <AppText variant="label" style={[styles.text, { color: tint }]}>{message}</AppText>
  </View>;
}
const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: spacing.sm, borderRadius: radii.control, padding: spacing.md, alignItems: 'flex-start' },
  text: { flex: 1 },
});
