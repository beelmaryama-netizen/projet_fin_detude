import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './AppText';
import { radii, spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppPalette } from '../theme/palette';

export function NumberStepper({ label, value, onChange, min = 0, max = 30 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; }) {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View style={styles.row}>
    <AppText variant="label" style={styles.label}>{label}</AppText>
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Diminuer : ' + label} disabled={value <= min} style={[styles.button, value <= min && styles.disabled]} onPress={() => onChange(Math.max(min, value - 1))}>
        <Ionicons name="remove" size={20} color={palette.primary} accessible={false} />
      </Pressable>
      <AppText accessibilityLiveRegion="polite" style={styles.value}>{value}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={'Augmenter : ' + label} disabled={value >= max} style={[styles.button, value >= max && styles.disabled]} onPress={() => onChange(Math.min(max, value + 1))}>
        <Ionicons name="add" size={20} color={palette.primary} accessible={false} />
      </Pressable>
    </View>
  </View>;
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    row: { gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: palette.border },
    label: { flexShrink: 1 }, controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.iconSoft, borderRadius: radii.control },
    value: { minWidth: 40, textAlign: 'center' }, disabled: { opacity: 0.4 },
  });
}
