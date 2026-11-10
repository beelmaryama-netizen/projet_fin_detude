import { useEffect, useRef, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { spacing, radii, type ThemeColors } from '../../../theme/tokens';
export type EmployerTab = 'dashboard' | 'requests' | 'reservations' | 'employees';
const tabs = [
 { value: 'dashboard', label: 'Accueil', icon: 'home-outline' },
 { value: 'requests', label: 'Demandes', icon: 'document-text-outline' },
 { value: 'reservations', label: 'Missions', icon: 'calendar-outline' },
 { value: 'employees', label: 'Employés', icon: 'people-outline' },
] as const;
export function EmployerLayout({ children, activeTab, onTabChange, onMenu, onNotifications, notificationCount, navigationKey }: PropsWithChildren<{
 activeTab: EmployerTab; onTabChange: (tab: EmployerTab) => void; onMenu: () => void; onNotifications: () => void; notificationCount: number; navigationKey?: string;
}>) {
 const { colors } = useAppTheme(); const styles = createStyles(colors);
 const insets = useSafeAreaInsets(); const scroll = useRef<ScrollView>(null);
 useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [activeTab, navigationKey]);
 return <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
 <StatusBar style="light" />
 <LinearGradient colors={[colors.primaryDark, colors.primaryFill]}>
  <View style={styles.header}>
   <Pressable onPress={onMenu} accessibilityRole="button" accessibilityLabel="Ouvrir le menu administration" style={styles.headerButton}><Ionicons name="menu-outline" size={26} color={colors.white} /></Pressable>
   <AppText variant="heading" style={styles.headerTitle}>Administration</AppText>
   <Pressable onPress={onNotifications} accessibilityRole="button" accessibilityLabel={'Notifications, ' + notificationCount + ' demandes à traiter'} style={styles.headerButton}>
    <Ionicons name="notifications-outline" size={24} color={colors.white} />
    {notificationCount > 0 && <View style={styles.badge}><AppText style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</AppText></View>}
   </Pressable>
  </View>
 </LinearGradient>
 <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
  <ScrollView ref={scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}</ScrollView>
 </KeyboardAvoidingView>
 <View style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
  {tabs.map(tab => <Pressable key={tab.value} onPress={() => onTabChange(tab.value)} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: activeTab === tab.value }} style={styles.tab}>
   <Ionicons name={tab.icon} size={24} color={activeTab === tab.value ? colors.primary : colors.muted} />
   <AppText variant="caption" style={{ color: activeTab === tab.value ? colors.primary : colors.muted, textAlign: 'center' }}>{tab.label}</AppText>
  </Pressable>)}
 </View>
 </SafeAreaView>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
 root: { flex: 1, backgroundColor: colors.primaryDark },
 header: { width: '100%', maxWidth: 688, alignSelf: 'center', padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
 headerButton: { width: 48, height: 48, borderRadius: radii.card, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF20' },
 headerTitle: { flex: 1, color: colors.white, textAlign: 'center', fontSize: 18 },
 badge: { position: 'absolute', right: -4, top: -4, minWidth: 20, minHeight: 20, paddingHorizontal: spacing.xs, borderRadius: radii.control, backgroundColor: colors.primaryFill, borderWidth: 1, borderColor: colors.white, alignItems: 'center' },
 badgeText: { color: colors.white, fontSize: 11, lineHeight: 18 },
 content: { flex: 1, backgroundColor: colors.background },
 body: { width: '100%', maxWidth: 688, alignSelf: 'center', padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
 navigation: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', paddingTop: spacing.sm },
 tab: { flex: 1, minWidth: 0, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
});
