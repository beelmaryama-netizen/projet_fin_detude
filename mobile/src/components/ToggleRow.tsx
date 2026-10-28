import { Switch, View } from 'react-native';
import { AppText } from './AppText';
import { spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';
export function ToggleRow({ label, value, onChange, disabled = false }: { label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  const { colors } = useAppTheme();

  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 }}><AppText style={{ flex: 1 }}>{label}</AppText><Switch accessibilityLabel={label} value={value} disabled={disabled} onValueChange={onChange} trackColor={{ true: colors.teal, false: colors.border }} /></View>;
}
