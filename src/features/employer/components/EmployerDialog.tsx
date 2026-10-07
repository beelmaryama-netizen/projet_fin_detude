import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { employerTheme } from '../theme';

export function EmployerDialog({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient colors={['#17345F', '#0D2448']} style={styles.panel} accessibilityViewIsModal onAccessibilityEscape={onClose}>
          <View style={styles.heading}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>{title}</AppText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer la fenêtre"
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={23} color={employerTheme.text} accessible={false} />
            </Pressable>
          </View>
          {children}
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#020A1CDE' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  panel: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    borderWidth: 1, borderColor: employerTheme.border, borderRadius: 20,
    padding: 20, gap: 16,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: employerTheme.text, fontSize: 22, lineHeight: 30 },
  close: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#294D8355', alignItems: 'center', justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
