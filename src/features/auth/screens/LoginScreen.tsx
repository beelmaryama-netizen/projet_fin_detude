import { StyleSheet, View } from 'react-native';
import type { AuthScreenProps } from '../../../navigation/types';
import { AuthLayout } from '../components/AuthLayout';
import { ControlledField } from '../../../components/ControlledField';
import { SocialButtons } from '../components/SocialButtons';
import { Button } from '../../../components/Button';
import { AppText } from '../../../components/AppText';
import { MessageBanner } from '../../../components/MessageBanner';
import { useLogin } from '../hooks/useAuthFlow';
import { colors, spacing } from '../../../theme/tokens';

export function LoginScreen({ navigation, route }: AuthScreenProps<'Login'>) {
  const auth = useLogin(route.params?.email);
  return <AuthLayout title="Connexion" subtitle="Accédez à votre compte pour continuer." onBack={() => navigation.navigate('Splash')}>
    <MessageBanner message={route.params?.notice} tone="success" />
    <View style={styles.fields}>
      <ControlledField control={auth.form.control} name="email" label="Courriel" placeholder="vous@exemple.ca" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" onSubmitEditing={() => auth.form.setFocus('password')} editable={!auth.busy} />
      <ControlledField control={auth.form.control} name="password" label="Mot de passe" password autoComplete="current-password" textContentType="password" autoCapitalize="none" autoCorrect={false} returnKeyType="go" onSubmitEditing={() => { if (!auth.busy) void auth.submit(); }} editable={!auth.busy} />
      <Button title="Mot de passe oublié ?" variant="link" onPress={() => navigation.navigate('ForgotPassword')} disabled={auth.busy} style={styles.forgot} />
      <MessageBanner message={auth.error} />
      <Button title="Se connecter" onPress={() => void auth.submit()} loading={auth.loginPending} disabled={auth.busy} icon="arrow-forward" />
    </View>
    <SocialButtons onPress={auth.socialLogin} pending={auth.pendingProvider} disabled={auth.busy} />
    <View><AppText variant="label" style={styles.center}>Vous n’avez pas de compte ?</AppText>
      <Button title="S’inscrire" variant="link" onPress={() => navigation.navigate('Register')} disabled={auth.busy} /></View>
  </AuthLayout>;
}
const styles = StyleSheet.create({ fields: { gap: spacing.md }, forgot: { alignSelf: 'flex-end', paddingHorizontal: 0 }, center: { textAlign: 'center', color: colors.muted } });
