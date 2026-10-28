import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './AppText';
import { radii, spacing, type ThemeColors } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';

export function NumberStepper({ label, value, onChange, min = 0, max = 30 }: {
  label: string; value: number; onChange: (value: number) => void; min?: number; max?: number;
}) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return <View style={styles.row}>
    <AppText variant="label" style={styles.label}>{label}</AppText>
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Diminuer : ${label}`} accessibilityState={{ disabled: value <= min }} disabled={value <= min}
        style={[styles.button, value <= min && styles.disabled]} onPress={() => onChange(Math.max(min, value - 1))}>
        <Ionicons name="remove" size={20} color={colors.primary} accessible={false} />
      </Pressable>
      <AppText accessibilityLiveRegion="polite" accessibilityLabel={`${label} : ${value}`} style={styles.value}>{value}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={`Augmenter : ${label}`} accessibilityState={{ disabled: value >= max }} disabled={value >= max}
        style={[styles.button, value >= max && styles.disabled]} onPress={() => onChange(Math.min(max, value + 1))}>
        <Ionicons name="add" size={20} color={colors.primary} accessible={false} />
      </Pressable>
    </View>
  </View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { flexShrink: 1 }, controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paleBlue, borderRadius: radii.control },
  value: { minWidth: 40, textAlign: 'center' }, disabled: { opacity: 0.4 },
});
