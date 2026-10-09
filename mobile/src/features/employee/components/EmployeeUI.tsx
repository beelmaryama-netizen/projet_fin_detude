import type { ComponentProps, ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle, type TextInputProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { FormField } from '../../../components/FormField';
import { useSession } from '../../auth/hooks/useSession';
import { colors, fonts, radii, spacing } from '../../../theme/tokens';
import type { EmployeeMission } from '../types/employee';
import { getProgress } from '../services/missionRules';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function EmployeeLayout({ title, subtitle, onBack, children }: { title: string; subtitle?: string; onBack?: () => void; children: ReactNode }) {
  const { signOut, busy, error } = useSession();
  return <View style={styles.page}>
    <LinearGradient colors={[colors.primaryDark, colors.primary, colors.primaryActive]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image source={require('../../../../assets/magicpro-logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="MagiquePro" />
            <View style={styles.employeeLabel}><View style={styles.liveDot} /><AppText variant="label" style={styles.white}>Espace employé</AppText></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Se déconnecter" accessibilityState={{ disabled: busy }} disabled={busy} onPress={signOut} style={styles.iconButton}>
              <Ionicons name="log-out-outline" color={colors.white} size={23} />
            </Pressable>
          </View>
          {onBack && <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack} style={styles.back}>
            <Ionicons name="arrow-back" color={colors.white} size={18} /><AppText variant="label" style={styles.white}>Retour</AppText>
          </Pressable>}
          <AppText variant="title" accessibilityRole="header" style={styles.headerTitle}>{title}</AppText>
          {!!subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
        </View>
      </SafeAreaView>
    </LinearGradient>
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.body}>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.content}>
            {error && <Notice tone="error">{error}</Notice>}
            {children}
            <View style={styles.demo}><Ionicons name="flask-outline" color={colors.muted} size={14} /><AppText variant="caption" style={ui.muted}>Données de démonstration</AppText></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  return <View style={{ gap: 4 }}>{eyebrow && <AppText variant="caption" style={styles.eyebrow}>{eyebrow}</AppText>}<AppText variant="heading" accessibilityRole="header" style={styles.sectionTitle}>{children}</AppText></View>;
}

const statuses: Record<EmployeeMission['status'], { title: string; color: string; background: string; icon: IconName }> = {
  UPCOMING: { title: 'À venir', color: colors.primaryDark, background: colors.paleBlue, icon: 'calendar-outline' },
  IN_PROGRESS: { title: 'En cours', color: '#805500', background: '#FFF5D6', icon: 'time-outline' },
  REPORT_PENDING: { title: 'Rapport à compléter', color: colors.primaryDark, background: '#EEF0FF', icon: 'document-text-outline' },
  COMPLETED: { title: 'Terminée', color: colors.success, background: colors.successSurface, icon: 'checkmark-circle-outline' },
};

export function StatusBadge({ status }: { status: EmployeeMission['status'] }) {
  const entry = statuses[status];
  return <View style={[styles.badge, { backgroundColor: entry.background }]}><Ionicons name={entry.icon} size={15} color={entry.color} /><AppText variant="caption" style={{ color: entry.color, fontFamily: fonts.bold }}>{entry.title}</AppText></View>;
}

export function Progress({ mission }: { mission: EmployeeMission }) {
  const progress = getProgress(mission);
  return <View style={ui.smallGap}>
    <View style={ui.between}><AppText variant="label" style={{ flexShrink: 1 }}>{progress.done} tâches réalisées sur {progress.total}</AppText><AppText variant="label" style={styles.progressLabel}>{Math.round(progress.percent)} %</AppText></View>
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Avancement de la mission" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress.percent) }} style={styles.track}><View style={[styles.fill, { width: `${progress.percent}%` }]} /></View>
    {progress.notApplicable > 0 && <AppText variant="caption" style={ui.muted}>{progress.notApplicable} tâche(s) non applicable(s) justifiée(s)</AppText>}
  </View>;
}

export function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <View style={styles.infoRow}><View style={styles.infoIcon}><Ionicons name={icon} color={colors.primary} size={19} /></View><View style={styles.infoContent}><AppText variant="caption" style={ui.muted}>{label}</AppText><AppText style={styles.infoValue}>{value}</AppText></View></View>;
}

export function Field({ label, value, onChangeText, error, multiline, placeholder, keyboardType, editable = true }: { label: string; value: string; onChangeText: (text: string) => void; error?: string; multiline?: boolean; placeholder?: string; keyboardType?: TextInputProps['keyboardType']; editable?: boolean }) {
  return <FormField label={label} value={value} onChangeText={onChangeText} error={error} multiline={multiline} placeholder={placeholder} keyboardType={keyboardType} editable={editable} maxLength={multiline ? 2000 : 160} style={[multiline && { minHeight: 104, textAlignVertical: 'top' }, !editable && { color: colors.muted, backgroundColor: colors.background, borderRadius: radii.control }]} />;
}

export function Action({ variant = 'primary', ...props }: { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost'; icon?: IconName; disabled?: boolean; loading?: boolean }) {
  return <Button {...props} variant={variant === 'ghost' ? 'link' : variant} />;
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  const color = tone === 'error' ? colors.danger : tone === 'success' ? colors.success : colors.primaryDark;
  return <View style={[styles.notice, { backgroundColor: tone === 'error' ? colors.dangerSurface : tone === 'success' ? colors.successSurface : colors.paleBlue }]}><Ionicons name={tone === 'error' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'} size={20} color={color} /><AppText variant="label" accessibilityLiveRegion="polite" style={{ color, flex: 1 }}>{children}</AppText></View>;
}

export const ui = StyleSheet.create({
  muted: { color: colors.muted }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  gap: { gap: spacing.md }, smallGap: { gap: spacing.sm }, title: { fontFamily: fonts.title, color: colors.ink, fontSize: 18, lineHeight: 27 },
  heroNumber: { fontFamily: fonts.titleBold, color: colors.primaryDark, fontSize: 36, lineHeight: 48 },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, body: { flex: 1 },
  header: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 26, paddingTop: 8, gap: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, minHeight: 66 },
  logo: { width: 92, height: 62 }, employeeLabel: { flexDirection: 'row', gap: 7, alignItems: 'center', flexShrink: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A6D8FF' },
  white: { color: colors.white }, iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: '#FFFFFF15' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, alignSelf: 'flex-start', paddingRight: 12 },
  headerTitle: { color: colors.white, fontSize: 26, lineHeight: 35 }, subtitle: { color: colors.onDarkMuted, fontSize: 14, lineHeight: 21 },
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 28 }, content: { width: '100%', maxWidth: 636, alignSelf: 'center', gap: 18 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 20, gap: 16, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 18, lineHeight: 27 }, eyebrow: { color: colors.primary, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2 },
  badge: { borderRadius: 20, flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, infoIcon: { backgroundColor: colors.paleBlue, borderRadius: 10, padding: 9 }, infoContent: { flex: 1, gap: 2 }, infoValue: { fontSize: 14, lineHeight: 21, fontFamily: fonts.medium },
  track: { height: 8, backgroundColor: colors.paleBlue, borderRadius: 4, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.primaryActive, borderRadius: 4 }, progressLabel: { color: colors.primary, fontFamily: fonts.bold },
  notice: { borderRadius: radii.control, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  demo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
});
