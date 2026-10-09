import { useMemo, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './AppText';
import { radii, spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppPalette } from '../theme/palette';

interface Props {
  title: string;
  description?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}

export function SelectionCard({ title, description, icon, selected, onPress, compact = false }: Props) {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={description ? title + '. ' + description : title}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.compact, compact && !!icon && styles.compactIcon, selected && styles.selected, pressed && styles.pressed]}
    >
      {icon && (
        <View style={styles.icon}>
          <Ionicons name={icon} size={compact ? 22 : 26} color={palette.primary} accessible={false} />
        </View>
      )}
      <View style={styles.text}>
        <AppText variant="label" style={selected && styles.selectedText}>{title}</AppText>
        {description && <AppText variant="caption" style={styles.muted}>{description}</AppText>}
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? palette.primary : palette.textSecondary} accessible={false} />
    </Pressable>
  );
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md, backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border, minHeight: 78 },
    compact: { flex: 1, minWidth: 120, gap: spacing.sm, minHeight: 62 },
    compactIcon: { minWidth: 210 },
    selected: { backgroundColor: palette.surfaceAlt, borderColor: palette.primary, borderWidth: 1.5 },
    icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.iconSoft },
    text: { flex: 1, gap: 2 },
    selectedText: { color: palette.primary },
    muted: { color: palette.textSecondary },
    pressed: { opacity: 0.76 },
  });
}
