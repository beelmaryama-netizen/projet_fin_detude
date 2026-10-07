import { useMemo } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useAppTheme } from '../theme/useAppTheme';
import type { RootStackParamList } from './types';
import { ClientNavigator } from './ClientNavigator';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { VerificationScreen } from '../features/auth/screens/VerificationScreen';
import { AuthenticatedNotice } from '../features/auth/components/AuthenticatedNotice';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const user = useAuthStore(state => state.session?.user);
  const { palette, isDark } = useAppTheme();
  const theme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return { ...base, dark: isDark, colors: { ...base.colors, primary: palette.primary, background: palette.background, card: palette.surface, text: palette.text, border: palette.border } };
  }, [isDark, palette]);

  return <NavigationContainer theme={theme}>
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background }, animation: 'slide_from_right' }}>
      {user?.role === 'CLIENT' ? <Stack.Screen name="Client" component={ClientNavigator} navigationKey={'client-' + user.id} /> : user ? <Stack.Screen name="Login" component={AuthenticatedNotice} navigationKey="authenticated" /> :
        <Stack.Group navigationKey="public">
          <Stack.Screen name="Splash" component={SplashScreen} options={{ title: 'Bienvenue · MagiquePro' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion · MagiquePro' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription client · MagiquePro' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Mot de passe oublié · MagiquePro' }} />
          <Stack.Screen name="Verification" component={VerificationScreen} getId={({ params }) => params.challenge.id} options={{ title: 'Vérification · MagiquePro', gestureEnabled: false }} />
        </Stack.Group>}
    </Stack.Navigator>
  </NavigationContainer>;
}
