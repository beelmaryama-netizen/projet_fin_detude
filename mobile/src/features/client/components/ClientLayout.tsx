import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { spacing, type ThemeColors } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/ThemeProvider';

export function ClientLayout({ children, title, subtitle, onBack, onNotifications, header, bottomSafeArea = !!onBack, refreshing = false, onRefresh }: PropsWithChildren<{
  title?: string; subtitle?: string; onBack?: () => void; onNotifications?: () => void; header?: ReactNode; bottomSafeArea?: boolean; refreshing?: boolean; onRefresh?: () => void;
}>) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return <SafeAreaView style={styles.root} edges={bottomSafeArea ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}>
      <LinearGradient colors={[colors.primaryDark, colors.primaryFill]} style={styles.header}>
        <View style={styles.inner}>
          {(onBack || onNotifications) && <View style={styles.top}>
            {onBack && <Pressable style={styles.icon} onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour">
              <Ionicons name="arrow-back" size={24} color={colors.white} accessible={false} />
            </Pressable>}
            {onNotifications && <Pressable style={[styles.icon, styles.notifications]} onPress={onNotifications} accessibilityRole="button" accessibilityLabel="Notifications">
              <Ionicons name="notifications-outline" size={24} color={colors.white} accessible={false} />
            </Pressable>}
          </View>}
          {title && <AppText variant="title" accessibilityRole="header" style={styles.title}>{title}</AppText>}
          {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
          {header}
        </View>
      </LinearGradient>
      <View style={styles.body}>{children}</View>
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryDark }, scroll: { flexGrow: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  inner: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, notifications: { marginLeft: 'auto' },
  icon: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 16, backgroundColor: '#FFFFFF20' },
  title: { color: colors.white }, subtitle: { color: colors.onDarkMuted },
  body: { width: '100%', maxWidth: 688, alignSelf: 'center', padding: spacing.lg, gap: spacing.lg },
});
