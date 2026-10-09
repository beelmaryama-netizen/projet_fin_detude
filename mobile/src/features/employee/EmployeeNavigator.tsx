import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../theme/tokens';
import { useEmployeeStore } from './hooks/useEmployeeStore';
import type { EmployeeStackParamList } from './types/navigation';
import { Action, EmployeeLayout, Notice } from './components/EmployeeUI';
import { EmployeeWelcomeScreen } from './screens/EmployeeWelcomeScreen';
import { EmployeeMissionsScreen } from './screens/EmployeeMissionsScreen';
import { MissionDetailScreen } from './screens/MissionDetailScreen';
import { MissionChecklistScreen } from './screens/MissionChecklistScreen';
import { MissionActiveScreen } from './screens/MissionActiveScreen';
import { MissionCompletedScreen } from './screens/MissionCompletedScreen';
import { MissionReportScreen } from './screens/MissionReportScreen';

const Stack = createNativeStackNavigator<EmployeeStackParamList>();

export function EmployeeNavigator() {
  const load = useEmployeeStore(state => state.load);
  const loading = useEmployeeStore(state => state.loading);
  const error = useEmployeeStore(state => state.error);
  const onboarded = useEmployeeStore(state => state.onboarded);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <EmployeeLayout title="Vos missions arrivent…"><ActivityIndicator color={colors.primary} size="large" accessibilityLabel="Chargement des missions" /></EmployeeLayout>;
  if (error) return <EmployeeLayout title="Mes missions"><Notice tone="error">{error}</Notice><Action title="Réessayer" onPress={() => void load()} /></EmployeeLayout>;
  return <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }}>
    {!onboarded ? <Stack.Screen name="Welcome" component={EmployeeWelcomeScreen} options={{ title: 'Bienvenue · Espace employé' }} /> : <Stack.Group>
      <Stack.Screen name="Missions" component={EmployeeMissionsScreen} options={{ title: 'Mes missions · Espace employé' }} />
      <Stack.Screen name="Detail" component={MissionDetailScreen} options={{ title: 'Détail de la mission' }} />
      <Stack.Screen name="Checklist" component={MissionChecklistScreen} options={{ title: 'Checklist de mission' }} />
      <Stack.Screen name="Active" component={MissionActiveScreen} options={{ title: 'Mission en cours' }} />
      <Stack.Screen name="Completed" component={MissionCompletedScreen} options={{ title: 'Bilan de mission' }} />
      <Stack.Screen name="Report" component={MissionReportScreen} options={{ title: 'Rapport de fin de mission' }} />
    </Stack.Group>}
  </Stack.Navigator>;
}
