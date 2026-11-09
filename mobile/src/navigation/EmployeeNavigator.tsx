import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/ThemeProvider';
import { useEmployeeUser } from '../features/employee/hooks/useEmployeeData';
import { useEmployeeDraftStore } from '../features/employee/store/employeeDraftStore';
import type { EmployeeStack, EmployeeTabs } from '../features/employee/navigation/types';
import { EmployeeHomeScreen, EmployeeAgendaScreen, EmployeeHistoryScreen } from '../features/employee/screens/EmployeeListScreens';
import { MissionDetailsScreen, MissionActiveScreen, MissionChecklistScreen, MissionCompletedScreen } from '../features/employee/screens/MissionDetailScreens';
import { MissionPhotoScreen } from '../features/employee/screens/MissionPhotoScreen';
import { MissionReportScreen } from '../features/employee/screens/MissionReportScreen';
import { EmployeeProfileScreen, EmployeeAppearanceScreen, EmployeeProfileEditScreen, EmployeePasswordScreen, EmployeeNotificationsScreen, EmployeePreferencesScreen, EmployeeHelpScreen } from '../features/employee/screens/EmployeeAccountScreens';
const Stack = createNativeStackNavigator<EmployeeStack>(); const Tabs = createBottomTabNavigator<EmployeeTabs>();
function EmployeeTabNavigator() {
 const { colors } = useAppTheme();
 return <Tabs.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarHideOnKeyboard: true }}>
 <Tabs.Screen name="EmployeeHome" component={EmployeeHomeScreen} options={{ title: 'Missions', tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" color={color} size={size} /> }} />
 <Tabs.Screen name="EmployeeAgenda" component={EmployeeAgendaScreen} options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
 <Tabs.Screen name="EmployeeHistory" component={EmployeeHistoryScreen} options={{ title: 'Historique', tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} /> }} />
 <Tabs.Screen name="EmployeeProfile" component={EmployeeProfileScreen} options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
 </Tabs.Navigator>;
}
export function EmployeeNavigator() {
 const user = useEmployeeUser(); const { colors } = useAppTheme();
 useEffect(() => { useEmployeeDraftStore.getState().bindOwner(user.id); return () => useEmployeeDraftStore.getState().bindOwner(null); }, [user.id]);
 return <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
 {user.mustChangePassword ? <Stack.Screen name="EmployeePassword" component={EmployeePasswordScreen} navigationKey="password-required" options={{ gestureEnabled: false }} /> : <Stack.Group navigationKey="employee-ready">
 <Stack.Screen name="EmployeeTabs" component={EmployeeTabNavigator} />
 <Stack.Screen name="MissionDetails" component={MissionDetailsScreen} />
 <Stack.Screen name="BeforePhotos" component={MissionPhotoScreen} />
 <Stack.Screen name="MissionActive" component={MissionActiveScreen} />
 <Stack.Screen name="MissionChecklist" component={MissionChecklistScreen} />
 <Stack.Screen name="AfterPhotos" component={MissionPhotoScreen} />
 <Stack.Screen name="MissionReport" component={MissionReportScreen} />
 <Stack.Screen name="MissionCompleted" component={MissionCompletedScreen} />
 <Stack.Screen name="EmployeeNotifications" component={EmployeeNotificationsScreen} />
 <Stack.Screen name="EmployeeAppearance" component={EmployeeAppearanceScreen} />
 <Stack.Screen name="EmployeePreferences" component={EmployeePreferencesScreen} />
 <Stack.Screen name="EmployeeProfileEdit" component={EmployeeProfileEditScreen} />
 <Stack.Screen name="EmployeePassword" component={EmployeePasswordScreen} />
 <Stack.Screen name="EmployeeHelp" component={EmployeeHelpScreen} />
 </Stack.Group>}</Stack.Navigator>;
}
