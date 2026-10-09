import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts, radii, spacing } from '../../../theme/tokens';
import { employerTheme } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function EmployerActionButton({ title, onPress, variant = 'primary', icon, loading = false, disabled = false, style, accessibilityHint }: Props) {
  const inactive = disabled || loading;
  const foreground = variant === 'primary' ? employerTheme.backgroundDeep : variant === 'link' ? employerTheme.blue : employerTheme.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={accessibilityHint}
    accessibilityState={{ disabled: inactive, busy: loading }} aria-disabled={inactive} aria-busy={loading} disabled={inactive} onPress={onPress}
    style={({ pressed }) => [styles.base, styles[variant], style, inactive && styles.disabled, pressed && styles.pressed]}>
    <View style={styles.content}>
      {loading ? <ActivityIndicator color={foreground} /> : icon ? <Ionicons name={icon} size={19} color={foreground} accessible={false} /> : null}
      <AppText style={[styles.text, { color: foreground }]}>{title}</AppText>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radii.control, paddingHorizontal: spacing.md, paddingVertical: 12, justifyContent: 'center', borderWidth: 1 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  text: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  primary: { backgroundColor: employerTheme.blue, borderColor: '#7BC1FF' },
  secondary: { backgroundColor: employerTheme.surface, borderColor: employerTheme.border },
  link: { backgroundColor: 'transparent', borderColor: 'transparent' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
