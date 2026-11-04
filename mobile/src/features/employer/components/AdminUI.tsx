import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { employerTheme as theme } from '../theme';

export const adminStyles = StyleSheet.create({
  section: { gap: 14 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  split: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, grow: { flexGrow: 1, flexBasis: 160 },
  title: { color: theme.text, fontFamily: fonts.titleBold, fontSize: 25, lineHeight: 33 },
  heading: { color: theme.text, fontFamily: fonts.bold, fontSize: 18, lineHeight: 27 },
  text: { color: theme.text, fontSize: 14, lineHeight: 22 }, muted: { color: theme.muted, fontSize: 13, lineHeight: 21 },
  number: { color: theme.blue, fontFamily: fonts.titleBold, fontSize: 28, lineHeight: 38 },
  divider: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14, gap: 10 },
  error: { color: '#FFB7BF', fontSize: 13, lineHeight: 21 }, success: { color: theme.success, fontSize: 13, lineHeight: 21 },
});

export function AdminPage({ title, subtitle, onBack, children }: PropsWithChildren<{ title: string; subtitle?: string; onBack: () => void }>) {
  return <View style={adminStyles.section}>
    <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour" style={styles.back}>
      <Ionicons name="arrow-back" size={20} color={theme.blue} /><AppText style={styles.backText}>Retour</AppText>
    </Pressable>
    <AppText accessibilityRole="header" style={adminStyles.title}>{title}</AppText>
    {subtitle && <AppText style={adminStyles.muted}>{subtitle}</AppText>}
    {children}
  </View>;
}
export function AdminCard({ children }: PropsWithChildren) {
  return <LinearGradient colors={['#173764', '#10264B']} style={styles.card}>{children}</LinearGradient>;
}
export function AdminField({ label, error, hint, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  return <View style={styles.field}>
    <AppText style={styles.label}>{label}</AppText>
    <TextInput accessibilityLabel={label} placeholderTextColor="#91A7CA" selectionColor={theme.blue}
      {...props} style={[styles.input, props.multiline && styles.multiline, error && styles.invalid, props.style]} />
    {error ? <AppText accessibilityRole="alert" style={adminStyles.error}>{error}</AppText>
      : hint ? <AppText style={adminStyles.muted}>{hint}</AppText> : null}
  </View>;
}
export function AdminBadge({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'green' | 'orange' | 'muted' | 'red' }) {
  const colors = { blue: ['#1C487C', '#9BD4FF'], green: ['#164E4B', '#8BE4C2'], orange: ['#59442D', '#FFD39A'], muted: ['#294264', '#CBD9ED'], red: ['#572D45', '#FFB9CB'] };
  return <View style={[styles.badge, { backgroundColor: colors[tone][0] }]}><AppText style={[styles.badgeText, { color: colors[tone][1] }]}>{label}</AppText></View>;
}
export function AdminChips({ options, value, onChange }: { options: readonly { value: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  return <View style={styles.chips}>{options.map(option => <Pressable key={option.value} onPress={() => onChange(option.value)}
    accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: value === option.value }}
    style={[styles.chip, value === option.value && styles.selectedChip]}>
    <AppText style={[styles.chipText, value === option.value && styles.selectedText]}>{option.label}</AppText>
  </Pressable>)}</View>;
}
export function AdminEmpty({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return <AdminCard><Ionicons name="file-tray-outline" size={30} color={theme.blue} />
    <AppText style={adminStyles.heading}>{title}</AppText>{message && <AppText style={adminStyles.muted}>{message}</AppText>}{action}</AdminCard>;
}
export function AdminNotice({ message, error = false }: { message?: string; error?: boolean }) {
  return message ? <AppText accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite"
    style={error ? adminStyles.error : adminStyles.success}>{message}</AppText> : null;
}
export function AdminDetail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><AppText style={adminStyles.muted}>{label}</AppText><AppText style={adminStyles.text}>{value}</AppText></View>;
}

const styles = StyleSheet.create({
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 16 },
  backText: { color: theme.blue, fontSize: 14 },
  card: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 18, gap: 14 },
  field: { gap: 7 }, label: { color: theme.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#3B5C8C', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12,
    backgroundColor: '#0A2143', color: theme.text, fontFamily: fonts.body, fontSize: 15 },
  multiline: { minHeight: 110, textAlignVertical: 'top' }, invalid: { borderColor: '#FF9DAA' },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 11 },
  badgeText: { fontSize: 11, lineHeight: 18, fontFamily: fonts.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: theme.surface },
  selectedChip: { backgroundColor: '#265DB0', borderColor: theme.blue },
  chipText: { color: theme.muted, fontSize: 12, lineHeight: 20 }, selectedText: { color: theme.text },
});
