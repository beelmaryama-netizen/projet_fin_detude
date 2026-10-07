import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme/tokens';

interface Props {
  title: string; description?: string; icon?: ComponentProps<typeof Ionicons>['name'];
  selected: boolean; onPress: () => void; compact?: boolean;
}
export function SelectionCard({ title, description, icon, selected, onPress, compact = false }: Props) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={description ? `${title}. ${description}` : title}
    accessibilityState={{ checked: selected }} onPress={onPress}
    style={({ pressed }) => [styles.card, compact && styles.compact, compact && !!icon && styles.compactIcon, selected && styles.selected, pressed && styles.pressed]}>
    {icon && <Ionicons name={icon} size={compact ? 24 : 28} color={colors.primary} accessible={false} />}
    <View style={styles.text}>
      <AppText variant="label" style={selected && styles.selectedText}>{title}</AppText>
      {description && <AppText variant="caption" style={styles.muted}>{description}</AppText>}
    </View>
    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? colors.primary : colors.muted} accessible={false} />
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md, backgroundColor: colors.surface, borderRadius: radii.control, borderWidth: 1, borderColor: colors.border, minHeight: 76 },
  compact: { flex: 1, minWidth: 120, gap: spacing.sm, minHeight: 60 },
  compactIcon: { minWidth: 220 },
  selected: { backgroundColor: colors.paleBlue, borderColor: colors.primary },
  text: { flex: 1, gap: spacing.xs }, selectedText: { color: colors.primary }, muted: { color: colors.muted }, pressed: { opacity: 0.75 },
});
