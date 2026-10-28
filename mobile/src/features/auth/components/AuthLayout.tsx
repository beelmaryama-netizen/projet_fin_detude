import type { PropsWithChildren, ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radii, spacing, type ThemeColors } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { AppText } from '../../../components/AppText';

interface Props extends PropsWithChildren {
  title: string;
  subtitle: string;
  onBack?: () => void;
  step?: string;
  progress?: ReactNode;
  showFormLogo?: boolean;
}
export function AuthLayout({ children, title, subtitle, onBack, step, progress, showFormLogo = false }: Props) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return <View style={styles.root}>
    <LinearGradient colors={[colors.primaryDark, colors.primaryFill]} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll}>
          <View style={styles.container}>
            {(onBack || showFormLogo) && <View style={[styles.top, showFormLogo && styles.logoHeader]}>
              {onBack && <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack} style={[styles.back, showFormLogo && styles.logoBack]}>
                <Ionicons name="arrow-back" size={24} color={colors.white} accessible={false} />
              </Pressable>}
              {showFormLogo && <Image source={require('../../../../assets/magicpro-form-logo.png')} resizeMode="contain" accessibilityLabel="Logo MagicPro" style={styles.formLogo} />}
            </View>}
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
  </View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryDark },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.md, paddingBottom: spacing.lg, justifyContent: 'center' },
  container: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.sm },
  logoHeader: { justifyContent: 'center', minHeight: 108 },
  logoBack: { position: 'absolute', left: 0 },
  formLogo: { width: 128, height: 108 },
  back: { width: 44, height: 44, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF14', borderColor: '#FFFFFF40', borderWidth: 1 },
  card: { padding: spacing.lg, borderRadius: radii.card, gap: spacing.lg, backgroundColor: colors.background, borderWidth: 1, borderColor: '#FFFFFF70' },
  heading: { gap: spacing.sm },
  subtitle: { color: colors.muted },
  step: { color: colors.primary },
  footer: { color: colors.onDarkMuted, textAlign: 'center', marginTop: spacing.lg },
});
