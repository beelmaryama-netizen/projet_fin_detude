import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Brand } from '../../../components/Brand';
import { AppText } from '../../../components/AppText';
import { spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { AppPalette } from '../../../theme/palette';

export function ClientLayout({
  children,
  title,
  subtitle,
  onBack,
  onNotifications,
  header,
  bottomSafeArea = false,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onNotifications?: () => void;
  header?: ReactNode;
  bottomSafeArea?: boolean;
}>) {
  const { palette, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <SafeAreaView
      style={styles.root}
      edges={bottomSafeArea ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[palette.primaryDeep, palette.primaryDark, palette.primary]}
          locations={[0, 0.52, 1]}
          style={styles.header}
        >
          <View style={styles.headerGlowOne} />
          <View style={styles.headerGlowTwo} />
          <View style={styles.inner}>
            <View style={styles.top}>
              {onBack ? (
                <Pressable style={styles.iconButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour">
                  <Ionicons name="arrow-back" size={23} color={palette.white} accessible={false} />
                </Pressable>
              ) : <View style={styles.smallSpacer} />}

              <View style={styles.brand}><Brand /></View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.iconButton}
                  onPress={toggleTheme}
                  accessibilityRole="button"
                  accessibilityLabel={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
                >
                  <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={palette.white} accessible={false} />
                </Pressable>

                {onNotifications && (
                  <Pressable
                    style={styles.iconButton}
                    onPress={onNotifications}
                    accessibilityRole="button"
                    accessibilityLabel="Notifications"
                  >
                    <Ionicons name="notifications-outline" size={23} color={palette.white} accessible={false} />
                    <View style={styles.notificationDot}><AppText variant="caption" style={styles.notificationText}>2</AppText></View>
                  </Pressable>
                )}
              </View>
            </View>

            {title && <AppText variant="title" accessibilityRole="header" style={styles.title}>{title}</AppText>}
            {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
            {header}
          </View>
        </LinearGradient>

        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.primaryDeep },
    scroll: { flexGrow: 1, backgroundColor: palette.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      overflow: 'hidden',
      minHeight: 245,
    },
    headerGlowOne: {
      position: 'absolute',
      width: 230,
      height: 230,
      borderRadius: 115,
      right: -95,
      top: 72,
      backgroundColor: '#39A9FF20',
    },
    headerGlowTwo: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      right: 55,
      top: 128,
      backgroundColor: '#16C5EE12',
    },
    inner: { width: '100%', maxWidth: 660, alignSelf: 'center', gap: spacing.xs },
    top: { flexDirection: 'row', alignItems: 'center', minHeight: 96 },
    brand: { flex: 1, minWidth: 0 },
    actions: { flexDirection: 'row', gap: spacing.sm },
    smallSpacer: { width: 48 },
    iconButton: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 17,
      backgroundColor: '#FFFFFF14',
      borderColor: '#FFFFFF24',
      borderWidth: 1,
    },
    notificationDot: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF3D4A',
      borderWidth: 2,
      borderColor: palette.primaryDark,
    },
    notificationText: { color: palette.white, fontSize: 10, lineHeight: 12 },
    title: { color: palette.white, fontSize: 34, lineHeight: 42, marginTop: spacing.sm },
    subtitle: { color: palette.onDarkMuted, fontSize: 16, lineHeight: 24 },
    body: {
      width: '100%',
      maxWidth: 700,
      alignSelf: 'center',
      padding: spacing.lg,
      gap: spacing.lg,
      marginTop: -18,
    },
  });
}
