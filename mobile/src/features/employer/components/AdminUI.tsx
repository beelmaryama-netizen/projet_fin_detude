import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { employerTheme as theme } from '../theme';

export const adminColors = theme;

export function AdminCard({ children, style }: PropsWithChildren<{ style?: ViewStyle | ViewStyle[] }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AdminSectionTitle({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  return <View style={styles.sectionHeader}>
    <AppText accessibilityRole="header" style={styles.sectionTitle}>{children}</AppText>
    {action}
  </View>;
}

export function AdminBadge({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'green' | 'gold' | 'red' | 'muted' }) {
  const palette = {
    blue: ['#173E72', theme.blue],
    green: ['#123D38', theme.success],
    gold: ['#4B3814', '#FFD36A'],
    red: ['#4D222B', '#FF8C98'],
    muted: ['#223A5D', theme.muted],
  }[tone];
  return <View style={[styles.badge, { backgroundColor: palette[0], borderColor: palette[1] + '66' }]}>
    <AppText style={[styles.badgeText, { color: palette[1] }]}>{label}</AppText>
  </View>;
}

export function AdminButton({
  title, onPress, icon, variant = 'primary', disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
}) {
  const style = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    danger: styles.buttonDanger,
    ghost: styles.buttonGhost,
  }[variant];
  const color = variant === 'primary' ? theme.backgroundDeep : variant === 'danger' ? '#FFD7DD' : theme.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, style, disabled && styles.disabled, pressed && styles.pressed]}>
    {icon && <Ionicons name={icon} size={19} color={color} accessible={false} />}
    <AppText style={[styles.buttonText, { color }]}>{title}</AppText>
  </Pressable>;
}

export function AdminTextField({ label, error, multiline, style, ...props }: TextInputProps & { label: string; error?: string }) {
  return <View style={styles.fieldGroup}>
    <AppText style={styles.label}>{label}</AppText>
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor="#7189AC"
      style={[styles.input, multiline && styles.inputMultiline, style]}
    />
    {!!error && <AppText accessibilityLiveRegion="polite" style={styles.error}>{error}</AppText>}
  </View>;
}

export function AdminMetric({ icon, value, label }: { icon: ComponentProps<typeof Ionicons>['name']; value: string | number; label: string }) {
  return <AdminCard style={styles.metric}>
    <View style={styles.metricIcon}><Ionicons name={icon} size={22} color={theme.blue} /></View>
    <AppText style={styles.metricValue}>{value}</AppText>
    <AppText style={styles.metricLabel}>{label}</AppText>
  </AdminCard>;
}

export function formatCad(value: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value / 100);
}

export function formatAdminDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export const adminStyles = StyleSheet.create({
  pageTitle: { fontFamily: fonts.titleBold, fontSize: 28, lineHeight: 36, color: theme.text },
  pageSubtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  stack: { gap: 12 },
  muted: { color: theme.muted },
  text: { color: theme.text },
  link: { color: theme.blue },
  divider: { height: 1, backgroundColor: theme.border },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  sectionHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { flex: 1, fontFamily: fonts.titleBold, color: theme.text, fontSize: 19, lineHeight: 27 },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 16 },
  button: {
    minHeight: 48, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  buttonPrimary: { backgroundColor: theme.blue, borderColor: '#79C2FF' },
  buttonSecondary: { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
  buttonDanger: { backgroundColor: '#4D222B', borderColor: '#93404F' },
  buttonGhost: { backgroundColor: 'transparent', borderColor: theme.border },
  buttonText: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  fieldGroup: { gap: 6 },
  label: { color: theme.text, fontFamily: fonts.bold, fontSize: 12, lineHeight: 18 },
  input: {
    minHeight: 48, color: theme.text, backgroundColor: theme.backgroundDeep,
    borderWidth: 1, borderColor: theme.border, borderRadius: 13,
    paddingHorizontal: 13, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14,
  },
  inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
  error: { color: '#FF9BA5', fontSize: 12, lineHeight: 18 },
  metric: { flexGrow: 1, flexBasis: '45%', minWidth: 135 },
  metricIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#173E72', alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontFamily: fonts.titleBold, fontSize: 25, lineHeight: 32, color: theme.text },
  metricLabel: { color: theme.muted, fontSize: 12, lineHeight: 18 },
});
