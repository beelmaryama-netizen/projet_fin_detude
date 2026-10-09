import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AuthScreenProps } from '../../../navigation/types';
import { colors, radii, spacing } from '../../../theme/tokens';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Brand } from '../../../components/Brand';

export function SplashScreen({ navigation }: AuthScreenProps<'Splash'>) {
  return <LinearGradient colors={[colors.primaryDark, '#102D56', colors.primary]} style={styles.root}>
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.brand}><Brand large /></View>
          <View style={styles.intro}>
            <AppText variant="caption" style={styles.eyebrow}>VOTRE QUOTIDIEN, PLUS SEREIN</AppText>
            <AppText variant="title" accessibilityRole="header" style={styles.title}>Des espaces plus propres,{ '\n' }pour une vie meilleure.</AppText>
            <AppText style={styles.description}>Un entretien soigné pour votre maison et vos espaces professionnels.</AppText>
          </View>
          <View style={styles.benefits}>
            <View style={styles.benefit}><Ionicons name="shield-checkmark-outline" size={26} color={colors.white} accessible={false} /><AppText variant="label" style={styles.benefitText}>Professionnel et fiable</AppText></View>
            <View style={styles.benefit}><Ionicons name="leaf-outline" size={26} color="#70D8C2" accessible={false} /><AppText variant="label" style={styles.benefitText}>Produits écologiques</AppText></View>
            <View style={styles.benefit}><Ionicons name="sparkles-outline" size={26} color={colors.gold} accessible={false} /><AppText variant="label" style={styles.benefitText}>Un service attentionné</AppText></View>
          </View>
          <Button title="Commencer" variant="white" icon="arrow-forward" onPress={() => navigation.navigate('Login')} />
          <AppText variant="caption" style={styles.footer}>Résidentiel · Commercial · Industriel</AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.xl },
  brand: { alignItems: 'center', paddingTop: spacing.md },
  intro: { gap: spacing.md }, eyebrow: { color: colors.onDarkMuted, letterSpacing: 1.6 },
  title: { color: colors.white, fontSize: 32, lineHeight: 44 },
  description: { color: colors.onDarkMuted },
  benefits: { gap: spacing.md, padding: spacing.lg, borderRadius: radii.card, borderColor: '#FFFFFF26', borderWidth: 1, backgroundColor: '#FFFFFF08' },
  benefit: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  benefitText: { color: colors.white, flex: 1 }, footer: { color: colors.onDarkMuted, textAlign: 'center' },
});
