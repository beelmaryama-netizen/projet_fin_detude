import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Button } from './Button';
import { MessageBanner } from './MessageBanner';
import { radii, spacing, type ThemeColors } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';
export function ConfirmModal({ visible, title, message, confirmLabel, busy, error, onConfirm, onCancel, children }: PropsWithChildren<{ visible: boolean; title: string; message: string; confirmLabel: string; busy?: boolean; error?: string; onConfirm: () => void; onCancel: () => void }>) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
    <SafeAreaView style={styles.overlay}><KeyboardAvoidingView style={styles.avoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"><View accessibilityViewIsModal style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">{title}</AppText><AppText>{message}</AppText>{children}<MessageBanner message={error} />
      <Button title={confirmLabel} loading={busy} onPress={onConfirm} /><Button title="Retour" variant="secondary" disabled={busy} onPress={onCancel} />
    </View></ScrollView></KeyboardAvoidingView></SafeAreaView>
  </Modal>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({ overlay: { flex: 1, backgroundColor: '#00000070' }, avoid: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg }, card: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.background, padding: spacing.lg, borderRadius: radii.card, gap: spacing.md } });
