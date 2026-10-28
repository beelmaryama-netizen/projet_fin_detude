import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { radii, spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';
export function FilterTabs<T extends string>({ value, options, onChange }: { value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  const { colors } = useAppTheme();

  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: option.value === value }} onPress={() => onChange(option.value)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.control, backgroundColor: value === option.value ? colors.primaryFill : colors.surface, borderWidth: 1, borderColor: colors.border }}><AppText variant="label" style={{ color: value === option.value ? colors.white : colors.ink }}>{option.label}</AppText></Pressable>)}</View>;
}
