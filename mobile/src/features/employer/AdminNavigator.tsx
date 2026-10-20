import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { employerTheme as theme } from './theme';
import type { AdminStackParamList } from './types/admin';
import { AdminHomeScreen } from './screens/AdminHomeScreen';
import { CreateEstimateScreen, OfferPreviewScreen, OffersScreen } from './screens/AdminOfferScreens';
import { MissionsToAssignScreen, AssignEmployeesScreen, DispatchCalendarScreen, AdminMissionDetailScreen } from './screens/AdminMissionScreens';
import { EmployeesScreen, CreateEmployeeScreen, EmployeeDetailScreen, ClientsScreen, ClientDetailScreen } from './screens/AdminDirectoryScreens';
import { EmployerDashboardScreen } from './screens/EmployerDashboardScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return <Stack.Navigator
    initialRouteName="AdminHome"
    screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.backgroundDeep }, animation: 'slide_from_right' }}
  >
    <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
    <Stack.Screen name="CreateEstimate" component={CreateEstimateScreen} />
    <Stack.Screen name="OfferPreview" component={OfferPreviewScreen} />
    <Stack.Screen name="Offers" component={OffersScreen} />
    <Stack.Screen name="MissionsToAssign" component={MissionsToAssignScreen} />
    <Stack.Screen name="AssignEmployees" component={AssignEmployeesScreen} />
    <Stack.Screen name="DispatchCalendar" component={DispatchCalendarScreen} />
    <Stack.Screen name="MissionDetail" component={AdminMissionDetailScreen} />
    <Stack.Screen name="Employees" component={EmployeesScreen} />
    <Stack.Screen name="CreateEmployee" component={CreateEmployeeScreen} />
    <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
    <Stack.Screen name="Clients" component={ClientsScreen} />
    <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
    <Stack.Screen name="LegacyEmployerDashboard" component={EmployerDashboardScreen} />
  </Stack.Navigator>;
}
