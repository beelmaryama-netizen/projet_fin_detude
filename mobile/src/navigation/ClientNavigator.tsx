import { BusinessRequestScreen } from '../features/requests/screens/BusinessRequestScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppearanceScreen } from '../features/client/screens/AppearanceScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../components/AppText';
import { fonts } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';
import type { ClientStackParamList, ClientTabParamList } from './types';
import { ClientHomeScreen } from '../features/client/screens/ClientHomeScreen';
import { MyRequestsScreen } from '../features/client/screens/MyRequestsScreen';
import { MyReservationsScreen } from '../features/client/screens/MyReservationsScreen';
import { ClientProfileScreen } from '../features/client/screens/ClientProfileScreen';
import { RequestDetailsScreen } from '../features/client/screens/RequestDetailsScreen';
import { MyQuotesScreen } from '../features/client/screens/MyQuotesScreen';
import { QuoteDetailsScreen } from '../features/client/screens/QuoteDetailsScreen';
import { NotificationsScreen } from '../features/client/screens/NotificationsScreen';
import { EditProfileScreen } from '../features/client/screens/EditProfileScreen';
import { MyAddressesScreen } from '../features/client/screens/MyAddressesScreen';
import { AddressFormScreen } from '../features/client/screens/AddressFormScreen';
import { NotificationPreferencesScreen } from '../features/client/screens/NotificationPreferencesScreen';
import { SecurityScreen } from '../features/client/screens/SecurityScreen';
import { SupportScreen } from '../features/client/screens/SupportScreen';
import { ContactSupportScreen } from '../features/client/screens/ContactSupportScreen';
import { ResidentialSchedulePreferencesScreen } from '../features/requests/screens/ResidentialSchedulePreferencesScreen';
import { RequestReviewScreen } from '../features/requests/screens/RequestReviewScreen';
import { RequestSubmittedScreen } from '../features/requests/screens/RequestSubmittedScreen';
import { ClientPlaceholderScreen } from '../features/client/screens/ClientPlaceholderScreen';
import { ReservationDetailsScreen } from '../features/client/screens/ReservationDetailsScreen';
import { RequestTypeScreen } from '../features/requests/screens/RequestTypeScreen';
import { ResidentialPropertyDetailsScreen } from '../features/requests/screens/ResidentialPropertyDetailsScreen';

const Stack = createNativeStackNavigator<ClientStackParamList>();
const Tabs = createBottomTabNavigator<ClientTabParamList>();
const tabIcons = { ClientHomeScreen: 'home-outline', ClientRequests: 'clipboard-outline', ClientReservations: 'calendar-outline', ClientProfile: 'person-outline' } as const;
function ClientTabs() {
  const { colors } = useAppTheme();

  return <Tabs.Navigator screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 72 },
    tabBarLabelPosition: 'below-icon',
    tabBarLabel: ({ color, children }) => <AppText variant="caption" style={{ color, fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 2 }}>{children}</AppText>,
    tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 }, tabBarHideOnKeyboard: true,
    tabBarIcon: ({ color, size }) => <Ionicons name={tabIcons[route.name]} size={size} color={color} accessible={false} />,
  })}>
    <Tabs.Screen name="ClientHomeScreen" component={ClientHomeScreen} options={{ title: 'Accueil', tabBarAccessibilityLabel: 'Accueil' }} />
    <Tabs.Screen name="ClientRequests" component={MyRequestsScreen} options={{ title: 'Mes demandes', tabBarAccessibilityLabel: 'Mes demandes' }} />
    <Tabs.Screen name="ClientReservations" component={MyReservationsScreen} options={{ title: 'Réservations', tabBarAccessibilityLabel: 'Réservations' }} />
    <Tabs.Screen name="ClientProfile" component={ClientProfileScreen} options={{ title: 'Profil', tabBarAccessibilityLabel: 'Profil' }} />
  </Tabs.Navigator>;
}
export function ClientNavigator() {
  const { colors } = useAppTheme();

  return <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="ClientTabs" component={ClientTabs} />
    <Stack.Screen name="RequestTypeScreen" component={RequestTypeScreen} />
    <Stack.Screen name="ResidentialPropertyDetailsScreen" component={ResidentialPropertyDetailsScreen} />
    <Stack.Screen name="BusinessRequest" component={BusinessRequestScreen} />
    <Stack.Screen name="RequestFlowPlaceholder" component={ClientPlaceholderScreen} />
    <Stack.Screen name="ResidentialSchedulePreferences" component={ResidentialSchedulePreferencesScreen} />
    <Stack.Screen name="RequestReview" component={RequestReviewScreen} />
    <Stack.Screen name="RequestSubmitted" component={RequestSubmittedScreen} />
    <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
    <Stack.Screen name="MyQuotes" component={MyQuotesScreen} />
    <Stack.Screen name="QuoteDetails" component={QuoteDetailsScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Appearance" component={AppearanceScreen} />
    <Stack.Screen name="MyAddresses" component={MyAddressesScreen} />
    <Stack.Screen name="AddressForm" component={AddressFormScreen} />
    <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
    <Stack.Screen name="Security" component={SecurityScreen} />
    <Stack.Screen name="Support" component={SupportScreen} />
    <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
    <Stack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
  </Stack.Navigator>;
}
