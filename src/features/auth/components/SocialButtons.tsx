import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { colors, spacing } from '../../../theme/tokens';
import type { SocialProvider } from '../types/auth';

export function SocialButtons({ onPress, pending, disabled }: {
  onPress: (provider: SocialProvider) => void;
  pending?: SocialProvider;
  disabled: boolean;
}) {
  return <View style={styles.group}>
    <View style={styles.divider}><View style={styles.line} /><AppText variant="caption" style={styles.text}>ou continuer avec</AppText><View style={styles.line} /></View>
    <Button title="Continuer avec Google" icon="logo-google" variant="secondary" onPress={() => onPress('google')} loading={pending === 'google'} disabled={disabled} />
    <Button title="Continuer avec Apple" icon="logo-apple" variant="secondary" onPress={() => onPress('apple')} loading={pending === 'apple'} disabled={disabled} />
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.sm }, divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  line: { flex: 1, height: 1, backgroundColor: colors.border }, text: { color: colors.muted },
});
