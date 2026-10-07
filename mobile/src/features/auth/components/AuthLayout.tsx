import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radii, spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { AppPalette } from '../../../theme/palette';
import { AppText } from '../../../components/AppText';
import { Brand } from '../../../components/Brand';

interface Props extends PropsWithChildren {
  title: string;
  subtitle: string;
  onBack?: () => void;
  step?: string;
  progress?: ReactNode;
}

export function AuthLayout({ children, title, subtitle, onBack, step, progress }: Props) {
  const { palette, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[palette.primaryDeep, palette.primaryDark, palette.primary]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
              <View style={styles.top}>
                {onBack ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.white} accessible={false} />
                  </Pressable>
                ) : <View style={styles.spacer} />}

                <View style={styles.brand}><Brand /></View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
                  onPress={toggleTheme}
                  style={styles.iconButton}
                >
                  <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={palette.white} accessible={false} />
                </Pressable>
              </View>

              <View style={styles.card}>
                {progress}
                {step && <AppText variant="caption" style={styles.step}>{step}</AppText>}
                <View style={styles.heading}>
                  <AppText variant="title" accessibilityRole="header">{title}</AppText>
                  <AppText style={styles.subtitle}>{subtitle}</AppText>
                </View>
                {children}
              </View>

              <AppText variant="caption" style={styles.footer}>Entretien résidentiel, commercial et industriel</AppText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.primaryDeep },
    safe: { flex: 1 },
    scroll: { flexGrow: 1, padding: spacing.md, paddingBottom: spacing.lg, justifyContent: 'center' },
    container: { width: '100%', maxWidth: 560, alignSelf: 'center' },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, marginTop: spacing.xs },
    brand: { flex: 1 },
    spacer: { width: 48 },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF14',
      borderColor: '#FFFFFF2E',
      borderWidth: 1,
    },
    card: {
      padding: spacing.lg,
      borderRadius: 26,
      gap: spacing.lg,
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: palette.shadow,
      shadowOpacity: 0.13,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    heading: { gap: spacing.sm },
    subtitle: { color: palette.textSecondary },
    step: { color: palette.primary, fontSize: 11, letterSpacing: 0.5 },
    footer: { color: palette.onDarkMuted, textAlign: 'center', marginTop: spacing.lg },
  });
}
