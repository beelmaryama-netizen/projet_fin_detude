import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts } from '../theme/tokens';
import type { ClientStackParamList, ClientTabParamList } from './types';
import { ClientHomeScreen } from '../features/client/screens/ClientHomeScreen';
import { ClientSectionScreen } from '../features/client/screens/ClientSectionScreen';
import { ClientPlaceholderScreen } from '../features/client/screens/ClientPlaceholderScreen';
import { ReservationDetailsScreen } from '../features/client/screens/ReservationDetailsScreen';
import { RequestTypeScreen } from '../features/requests/screens/RequestTypeScreen';
import { ResidentialPropertyDetailsScreen } from '../features/requests/screens/ResidentialPropertyDetailsScreen';

const Stack = createNativeStackNavigator<ClientStackParamList>();
const Tabs = createBottomTabNavigator<ClientTabParamList>();
const tabIcons = { ClientHomeScreen: 'home-outline', ClientRequests: 'clipboard-outline', ClientReservations: 'calendar-outline', ClientProfile: 'person-outline' } as const;
function ClientTabs() {
  return <Tabs.Navigator screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64 },
    tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 }, tabBarHideOnKeyboard: true,
    tabBarIcon: ({ color, size }) => <Ionicons name={tabIcons[route.name]} size={size} color={color} accessible={false} />,
  })}>
    <Tabs.Screen name="ClientHomeScreen" component={ClientHomeScreen} options={{ title: 'Accueil', tabBarAccessibilityLabel: 'Accueil' }} />
    <Tabs.Screen name="ClientRequests" component={ClientSectionScreen} options={{ title: 'Mes demandes', tabBarAccessibilityLabel: 'Mes demandes' }} />
    <Tabs.Screen name="ClientReservations" component={ClientSectionScreen} options={{ title: 'Réservations', tabBarAccessibilityLabel: 'Réservations' }} />
    <Tabs.Screen name="ClientProfile" component={ClientSectionScreen} options={{ title: 'Profil', tabBarAccessibilityLabel: 'Profil' }} />
  </Tabs.Navigator>;
}
export function ClientNavigator() {
  return <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="ClientTabs" component={ClientTabs} />
    <Stack.Screen name="RequestTypeScreen" component={RequestTypeScreen} />
    <Stack.Screen name="ResidentialPropertyDetailsScreen" component={ResidentialPropertyDetailsScreen} />
    <Stack.Screen name="RequestFlowPlaceholder" component={ClientPlaceholderScreen} />
    <Stack.Screen name="RequestNextStep" component={ClientPlaceholderScreen} />
    <Stack.Screen name="Notifications" component={ClientPlaceholderScreen} />
    <Stack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
  </Stack.Navigator>;
}
