import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { RootNavigator } from './src/navigation/RootNavigator';
import { queryClient } from './src/services/queryClient';
import { colors } from './src/theme/tokens';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Poppins_600SemiBold, Poppins_700Bold, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  return <SafeAreaProvider>
    <StatusBar style="light" />
    {!fontsLoaded && !fontError ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.white} accessibilityLabel="Chargement de MagicPro" /></View>
      : <QueryClientProvider client={queryClient}><RootNavigator /></QueryClientProvider>}
  </SafeAreaProvider>;
}
const styles = StyleSheet.create({ loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryDark } });
