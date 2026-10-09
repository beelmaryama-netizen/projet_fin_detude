import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Brand } from '../../../components/Brand';
import { AppText } from '../../../components/AppText';
import { colors, spacing } from '../../../theme/tokens';

export function ClientLayout({ children, title, subtitle, onBack, onNotifications, header, bottomSafeArea = false }: PropsWithChildren<{
  title?: string; subtitle?: string; onBack?: () => void; onNotifications?: () => void; header?: ReactNode; bottomSafeArea?: boolean;
}>) {
  return <SafeAreaView style={styles.root} edges={bottomSafeArea ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <View style={styles.inner}>
          <View style={styles.top}>
            {onBack && <Pressable style={styles.icon} onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour">
              <Ionicons name="arrow-back" size={24} color={colors.white} accessible={false} />
            </Pressable>}
            <View style={styles.brand}><Brand /></View>
            {onNotifications && <Pressable style={styles.icon} onPress={onNotifications} accessibilityRole="button" accessibilityLabel="Notifications">
              <Ionicons name="notifications-outline" size={24} color={colors.white} accessible={false} />
            </Pressable>}
          </View>
          {title && <AppText variant="title" accessibilityRole="header" style={styles.title}>{title}</AppText>}
          {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
          {header}
        </View>
      </LinearGradient>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryDark }, scroll: { flexGrow: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  inner: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, brand: { flex: 1 },
  icon: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 16, backgroundColor: '#FFFFFF20' },
  title: { color: colors.white }, subtitle: { color: colors.onDarkMuted },
  body: { width: '100%', maxWidth: 688, alignSelf: 'center', padding: spacing.lg, gap: spacing.lg },
});
