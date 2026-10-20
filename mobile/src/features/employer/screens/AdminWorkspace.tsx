import type { PropsWithChildren, ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { employerTheme as theme } from '../theme';

export function AdminWorkspace({
  children, title, subtitle, onBack, right,
}: PropsWithChildren<{ title: string; subtitle?: string; onBack?: () => void; right?: ReactNode }>) {
  return <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
    <StatusBar style="light" />
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#0D2853', theme.background, theme.backgroundDeep]} style={StyleSheet.absoluteFill} />
      <View style={styles.glow} />
    </View>
    <View style={styles.header}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={23} color={theme.text} />
      </Pressable> : <View style={styles.iconPlaceholder} />}
      <Image source={require('../../../../assets/magicpro-logo.png')} resizeMode="contain" style={styles.logo} accessibilityLabel="MagiquePro" />
      <View style={styles.right}>{right}</View>
    </View>
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}>
        <AppText accessibilityRole="header" style={styles.title}>{title}</AppText>
        {!!subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
      </View>
      {children}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.backgroundDeep },
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: 100, right: -100, backgroundColor: '#2E78D51C' },
  header: { width: '100%', maxWidth: 680, alignSelf: 'center', minHeight: 82, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  logo: { flex: 1, height: 72, maxWidth: 190 },
  iconButton: { width: 48, height: 48, borderRadius: 15, borderWidth: 1, borderColor: theme.border, backgroundColor: '#15335D', alignItems: 'center', justifyContent: 'center' },
  iconPlaceholder: { width: 48 },
  right: { width: 48, alignItems: 'flex-end' },
  body: { width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1, paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  heading: { gap: 4, marginTop: 6 },
  title: { fontFamily: fonts.titleBold, fontSize: 28, lineHeight: 36, color: theme.text },
  subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
});
