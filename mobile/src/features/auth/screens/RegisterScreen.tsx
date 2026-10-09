import { StyleSheet, View } from 'react-native';
import type { AuthScreenProps } from '../../../navigation/types';
import { AuthLayout } from '../components/AuthLayout';
import { ControlledField } from '../../../components/ControlledField';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { SocialButtons } from '../components/SocialButtons';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { useRegistration } from '../hooks/useAuthFlow';
import { spacing } from '../../../theme/tokens';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const auth = useRegistration();
  return <AuthLayout title="Créer mon compte" subtitle="Votre premier pas vers des espaces plus propres." step="INSCRIPTION CLIENT · 1 SUR 2" onBack={() => navigation.goBack()}>
    <View style={styles.fields}>
      <ControlledField control={auth.form.control} name="firstName" label="Prénom" autoComplete="given-name" textContentType="givenName" autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => auth.form.setFocus('lastName')} editable={!auth.busy} />
      <ControlledField control={auth.form.control} name="lastName" label="Nom" autoComplete="family-name" textContentType="familyName" autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => auth.form.setFocus('email')} editable={!auth.busy} />
      <ControlledField control={auth.form.control} name="email" label="Courriel" placeholder="vous@exemple.ca" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" onSubmitEditing={() => auth.form.setFocus('phone')} editable={!auth.busy} />
      <ControlledField control={auth.form.control} name="phone" label="Téléphone" placeholder="514 555-0123" autoComplete="tel" textContentType="telephoneNumber" keyboardType="phone-pad" returnKeyType="next" onSubmitEditing={() => auth.form.setFocus('password')} editable={!auth.busy} />
      <ControlledField control={auth.form.control} name="password" label="Mot de passe" password autoComplete="new-password" textContentType="newPassword" autoCapitalize="none" autoCorrect={false} returnKeyType="next" onSubmitEditing={() => auth.form.setFocus('confirmPassword')} editable={!auth.busy} />
      <PasswordRequirements />
      <ControlledField control={auth.form.control} name="confirmPassword" label="Confirmer le mot de passe" password autoComplete="new-password" textContentType="newPassword" autoCapitalize="none" autoCorrect={false} returnKeyType="done" onSubmitEditing={() => { if (!auth.busy) void auth.submit(); }} editable={!auth.busy} />
      <MessageBanner message={auth.error} />
      <Button title="Créer mon compte" onPress={() => void auth.submit()} loading={auth.registerPending} disabled={auth.busy} icon="arrow-forward" />
    </View>
    <SocialButtons onPress={auth.socialLogin} pending={auth.pendingProvider} disabled={auth.busy} />
    <Button title="J’ai déjà un compte" variant="link" onPress={() => navigation.navigate('Login')} disabled={auth.busy} />
  </AuthLayout>;
}
const styles = StyleSheet.create({ fields: { gap: spacing.md } });
