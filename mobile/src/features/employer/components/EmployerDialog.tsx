import { useEmployerTheme, type EmployerTheme } from '../theme';
import { FormLogo } from '../../../components/FormLogo';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';

export function EmployerDialog({ title, onClose, children, showFormLogo = false }: {
  title: string; showFormLogo?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  return <Modal visible transparent animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.overlay}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[theme.surface, theme.surface]} style={styles.panel} accessibilityViewIsModal onAccessibilityEscape={onClose}>
          <View style={styles.heading}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>{title}</AppText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer la fenêtre"
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={23} color={theme.text} accessible={false} />
            </Pressable>
          </View>
          {showFormLogo && <FormLogo />}
          {children}
        </LinearGradient>
      </ScrollView></KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#020A1CDE' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  panel: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    borderWidth: 1, borderColor: theme.border, borderRadius: 16,
    padding: 16, gap: 16,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: theme.text, fontSize: 22, lineHeight: 30 },
  close: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: theme.paleBlue, alignItems: 'center', justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
}));
