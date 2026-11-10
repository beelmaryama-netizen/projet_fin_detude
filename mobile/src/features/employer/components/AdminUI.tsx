import { Card as AdminCard } from '../../../components/Card';
import { FormField, type FormFieldProps } from '../../../components/FormField';
import { FormLogo } from '../../../components/FormLogo';
import { useEmployerTheme, type EmployerTheme } from '../theme';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';

const createAdminStyles = (theme: EmployerTheme) => (StyleSheet.create({
  section: { gap: 16 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  split: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, grow: { flexGrow: 1, flexBasis: 160 },
  title: { color: theme.text, fontFamily: fonts.titleBold, fontSize: 25, lineHeight: 33 },
  heading: { color: theme.text, fontFamily: fonts.title, fontSize: 18, lineHeight: 27 },
  text: { color: theme.text, fontSize: 14, lineHeight: 22 }, muted: { color: theme.muted, fontSize: 13, lineHeight: 21 },
  number: { color: theme.blue, fontFamily: fonts.titleBold, fontSize: 28, lineHeight: 38 },
  divider: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14, gap: 10 },
  error: { color: theme.danger, fontSize: 13, lineHeight: 21 }, success: { color: theme.success, fontSize: 13, lineHeight: 21 },
}));

export function AdminPage({ title, subtitle, onBack, children, showFormLogo = false }: PropsWithChildren<{ title: string; subtitle?: string; showFormLogo?: boolean; onBack: () => void }>) {
  const theme = useEmployerTheme();
  const adminStyles = createAdminStyles(theme);
  const styles = createStyles(theme);

  return <View style={adminStyles.section}>
    <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour" style={styles.back}>
      <Ionicons name="arrow-back" size={20} color={theme.blue} /><AppText style={styles.backText}>Retour</AppText>
    </Pressable>
    {showFormLogo && <FormLogo />}
    <AppText accessibilityRole="header" style={adminStyles.title}>{title}</AppText>
    {subtitle && <AppText style={adminStyles.muted}>{subtitle}</AppText>}
    {children}
  </View>;
}
export { AdminCard };
export function AdminField(props: FormFieldProps) {
 return <FormField {...props} style={[props.multiline && { minHeight: 110, textAlignVertical: 'top' }, props.style]} />;
}
export function AdminBadge({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'green' | 'orange' | 'muted' | 'red' }) {
  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  const colors = { blue: [theme.paleBlue, theme.blue], green: [theme.successSurface, theme.success], orange: [theme.paleBlue, theme.ink], muted: [theme.paleBlue, theme.muted], red: [theme.dangerSurface, theme.danger] };
  return <View style={[styles.badge, { backgroundColor: colors[tone][0] }]}><AppText style={[styles.badgeText, { color: colors[tone][1] }]}>{label}</AppText></View>;
}
export function AdminChips({ options, value, onChange }: { options: readonly { value: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  return <View style={styles.chips}>{options.map(option => <Pressable key={option.value} onPress={() => onChange(option.value)}
    accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: value === option.value }}
    style={[styles.chip, value === option.value && styles.selectedChip]}>
    <AppText style={[styles.chipText, value === option.value && styles.selectedText]}>{option.label}</AppText>
  </Pressable>)}</View>;
}
export function AdminEmpty({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  const theme = useEmployerTheme();
  const adminStyles = createAdminStyles(theme);

  return <AdminCard><Ionicons name="file-tray-outline" size={30} color={theme.blue} />
    <AppText style={adminStyles.heading}>{title}</AppText>{message && <AppText style={adminStyles.muted}>{message}</AppText>}{action}</AdminCard>;
}
export function AdminNotice({ message, error = false }: { message?: string; error?: boolean }) {
  const theme = useEmployerTheme();
  const adminStyles = createAdminStyles(theme);

  return message ? <AppText accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite"
    style={error ? adminStyles.error : adminStyles.success}>{message}</AppText> : null;
}
export function AdminDetail({ label, value }: { label: string; value: string }) {
  const theme = useEmployerTheme();
  const adminStyles = createAdminStyles(theme);

  return <View style={{ gap: 3 }}><AppText style={adminStyles.muted}>{label}</AppText><AppText style={adminStyles.text}>{value}</AppText></View>;
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 16 },
  backText: { color: theme.blue, fontSize: 14 },
  card: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16, gap: 16 },
  field: { gap: 7 }, label: { color: theme.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20 },
  input: { minHeight: 48, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12,
    backgroundColor: theme.surface, color: theme.text, fontFamily: fonts.body, fontSize: 15 },
  multiline: { minHeight: 110, textAlignVertical: 'top' }, invalid: { borderColor: theme.danger },
  badge: { alignSelf: 'flex-start', borderRadius: 16, paddingVertical: 5, paddingHorizontal: 11 },
  badgeText: { fontSize: 11, lineHeight: 18, fontFamily: fonts.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: theme.surface },
  selectedChip: { backgroundColor: theme.paleBlue, borderColor: theme.blue },
  chipText: { color: theme.muted, fontSize: 12, lineHeight: 20 }, selectedText: { color: theme.text },
}));

export function useAdminStyles() { return createAdminStyles(useEmployerTheme()); }
