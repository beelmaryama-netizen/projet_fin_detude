import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { employerTheme } from '../theme';

export type EmployerTab = 'dashboard' | 'requests' | 'reservations' | 'employees';

const tabs = [
  { value: 'dashboard', label: 'Tableau de bord', icon: 'home' },
  { value: 'requests', label: 'Demandes', icon: 'document-text-outline' },
  { value: 'reservations', label: 'Réservations', icon: 'calendar-outline' },
  { value: 'employees', label: 'Employés', icon: 'people' },
] as const;

export function EmployerLayout({ children, activeTab, onTabChange, onMenu, onNotifications, notificationCount }: PropsWithChildren<{
  activeTab: EmployerTab;
  onTabChange: (tab: EmployerTab) => void;
  onMenu: () => void;
  onNotifications: () => void;
  notificationCount: number;
}>) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab]);

  return <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
    <StatusBar style="light" />
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={['#0D2853', employerTheme.background, employerTheme.backgroundDeep]} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['#2856AE45', '#163A7720']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ribbon} />
    </View>

    <View style={styles.header}>
      <Pressable onPress={onMenu} accessibilityRole="button" accessibilityLabel="Ouvrir le menu employeur"
        style={({ pressed }) => [styles.menu, pressed && styles.pressed]}>
        <Ionicons name="menu-outline" size={30} color={employerTheme.text} accessible={false} />
      </Pressable>
      <Image source={require('../../../../assets/magicpro-logo.png')} resizeMode="contain"
        style={styles.logo} accessibilityLabel="Magiquepro, entretien ménager commercial" />
      <Pressable onPress={onNotifications} accessibilityRole="button"
        accessibilityLabel={`Notifications, ${notificationCount} demande${notificationCount === 1 ? '' : 's'} à traiter`}
        style={({ pressed }) => [styles.notifications, pressed && styles.pressed]}>
        <Ionicons name="notifications" size={24} color={employerTheme.text} accessible={false} />
        {notificationCount > 0 && <View style={styles.badge}>
          <AppText style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</AppText>
        </View>}
      </Pressable>
    </View>

    <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>

    <LinearGradient colors={['#112F5C', '#081B39']} style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map(tab => {
        const selected = tab.value === activeTab;
        return <Pressable key={tab.value} onPress={() => onTabChange(tab.value)}
          accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }} aria-selected={selected}
          style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
          <View style={[styles.tabIcon, selected && styles.activeIcon]}>
            <Ionicons name={tab.icon} size={24} color={selected ? employerTheme.text : '#E0EAFA'} accessible={false} />
          </View>
          <AppText style={[styles.tabLabel, selected && styles.activeLabel]}>{tab.label}</AppText>
          <View style={[styles.underline, selected && styles.activeUnderline]} />
        </Pressable>;
      })}
    </LinearGradient>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: employerTheme.backgroundDeep, overflow: 'hidden' },
  ribbon: { position: 'absolute', top: 170, right: -200, width: 580, height: 150, borderRadius: 100, transform: [{ rotate: '-29deg' }] },
  header: { width: '100%', maxWidth: 680, alignSelf: 'center', minHeight: 88, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menu: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 132, height: 88, maxWidth: '60%' },
  notifications: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: '#315897', backgroundColor: '#23498088', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -6, right: -6, minWidth: 20, minHeight: 20, paddingHorizontal: 4, borderRadius: 12, backgroundColor: '#EF625B', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: employerTheme.text, fontSize: 11, lineHeight: 16 },
  pressed: { opacity: 0.75 },
  scroll: { flex: 1 },
  body: { width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 18 },
  navigation: { width: '100%', maxWidth: 680, alignSelf: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderBottomWidth: 0, borderColor: '#2A518D', paddingHorizontal: 6, flexDirection: 'row', alignItems: 'stretch' },
  tab: { flex: 1, minWidth: 0, minHeight: 76, paddingTop: 8, alignItems: 'center', gap: 3 },
  tabIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: '#398DF0', borderWidth: 1, borderColor: '#6AB8FF' },
  tabLabel: { alignSelf: 'stretch', color: '#CEDBF0', textAlign: 'center', fontSize: 10, lineHeight: 12 },
  activeLabel: { color: employerTheme.blue },
  underline: { width: 30, height: 3, marginTop: 3, borderRadius: 2, backgroundColor: 'transparent' },
  activeUnderline: { backgroundColor: employerTheme.blue },
});
