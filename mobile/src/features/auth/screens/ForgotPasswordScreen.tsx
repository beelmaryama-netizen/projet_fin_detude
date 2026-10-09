import Ionicons from '@expo/vector-icons/Ionicons';
import type { AuthScreenProps } from '../../../navigation/types';
import { AuthLayout } from '../components/AuthLayout';
import { ControlledField } from '../../../components/ControlledField';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { useForgotPassword } from '../hooks/useAuthFlow';
import { colors } from '../../../theme/tokens';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const auth = useForgotPassword();
  return <AuthLayout title="Mot de passe oublié" subtitle="Indiquez votre courriel pour recevoir un code et retrouver l’accès à votre compte." onBack={() => navigation.goBack()}>
    <Ionicons name="key-outline" size={40} color={colors.primary} accessible={false} />
    <ControlledField control={auth.form.control} name="email" label="Courriel" placeholder="vous@exemple.ca" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="send" onSubmitEditing={() => { if (!auth.busy) void auth.submit(); }} editable={!auth.busy} />
    <MessageBanner message={auth.error} />
    <Button title="Envoyer le code" onPress={() => void auth.submit()} loading={auth.busy} icon="mail-outline" />
    <Button title="Retour à la connexion" variant="link" onPress={() => navigation.navigate('Login')} disabled={auth.busy} />
  </AuthLayout>;
}
