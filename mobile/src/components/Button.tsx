import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { colors, fonts, radii, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'link' | 'white';
  icon?: ComponentProps<typeof Ionicons>['name'];
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}
export function Button({ title, onPress, loading = false, disabled = false, variant = 'primary', icon, style, accessibilityHint }: Props) {
  const inactive = disabled || loading;
  const foreground = variant === 'primary' ? colors.white : colors.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], inactive && styles.disabled, pressed && styles.pressed, style]}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={foreground} /> : icon ? <Ionicons name={icon} size={20} color={foreground} accessible={false} /> : null}
        <AppText style={[styles.text, { color: foreground }]}>{title}</AppText>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: { minHeight: 52, borderRadius: radii.control, paddingHorizontal: spacing.md, paddingVertical: 14, justifyContent: 'center', borderWidth: 1 },
  content: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 14, lineHeight: 22, fontFamily: fonts.bold, textAlign: 'center', flexShrink: 1 },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  white: { backgroundColor: colors.white, borderColor: colors.white },
  link: { backgroundColor: 'transparent', borderColor: 'transparent' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
