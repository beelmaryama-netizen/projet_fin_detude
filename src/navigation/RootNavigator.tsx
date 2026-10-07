import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/tokens';
import type { RootStackParamList } from './types';
import { ClientNavigator } from './ClientNavigator';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { VerificationScreen } from '../features/auth/screens/VerificationScreen';
import { AuthenticatedNotice } from '../features/auth/components/AuthenticatedNotice';
import { EmployerDashboardScreen } from '../features/employer/screens/EmployerDashboardScreen';
import { EmployeeNavigator } from '../features/employee/EmployeeNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.background, text: colors.ink, border: colors.border } };
export function RootNavigator() {
  const user = useAuthStore(state => state.session?.user);
  return <NavigationContainer theme={theme}>
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
      {user?.role === 'CLIENT' ? <Stack.Screen name="Client" component={ClientNavigator} navigationKey={`client-${user.id}`} />
        : user?.role === 'ADMIN' ? <Stack.Screen name="EmployerDashboard" component={EmployerDashboardScreen} navigationKey={`employer-${user.id}`} options={{ title: 'Tableau de bord employeur · MagicPro' }} />
        : user?.role === 'EMPLOYEE' ? <Stack.Screen name="Employee" component={EmployeeNavigator} navigationKey={`employee-${user.id}`} />
        : user ? <Stack.Screen name="Login" component={AuthenticatedNotice} navigationKey="authenticated" /> :
        <Stack.Group navigationKey="public">
          <Stack.Screen name="Splash" component={SplashScreen} options={{ title: 'Bienvenue · MagicPro' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion · MagicPro' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription client · MagicPro' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Mot de passe oublié · MagicPro' }} />
          <Stack.Screen name="Verification" component={VerificationScreen} getId={({ params }) => params.challenge.id} options={{ title: 'Vérification · MagicPro', gestureEnabled: false }} />
        </Stack.Group>}
    </Stack.Navigator>
  </NavigationContainer>;
}
