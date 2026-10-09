import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { fonts, radii, spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';
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
  const { palette } = useAppTheme();
  const inactive = disabled || loading;
  const foreground = variant === 'primary' ? palette.white : palette.primary;
  const background = variant === 'primary' ? palette.primary : variant === 'secondary' ? palette.surface : variant === 'white' ? palette.white : 'transparent';
  const borderColor = variant === 'primary' ? palette.primary : variant === 'secondary' ? palette.border : variant === 'white' ? palette.white : 'transparent';

  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={accessibilityHint}
    accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} onPress={onPress}
    style={({ pressed }) => [styles.base, { backgroundColor: background, borderColor }, inactive && styles.disabled, pressed && styles.pressed, style]}>
    <View style={styles.content}>
      {loading ? <ActivityIndicator color={foreground} /> : icon ? <Ionicons name={icon} size={20} color={foreground} accessible={false} /> : null}
      <AppText style={[styles.text, { color: foreground }]}>{title}</AppText>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  base: { minHeight: 54, borderRadius: radii.control, paddingHorizontal: spacing.md, paddingVertical: 14, justifyContent: 'center', borderWidth: 1 },
  content: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 14, lineHeight: 22, fontFamily: fonts.bold, textAlign: 'center', flexShrink: 1 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
