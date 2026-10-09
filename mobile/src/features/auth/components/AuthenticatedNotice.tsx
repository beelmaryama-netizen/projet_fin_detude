import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../../components/Button';
import { AppText } from '../../../components/AppText';
import { MessageBanner } from '../../../components/MessageBanner';
import { useSession } from '../hooks/useSession';
import { colors } from '../../../theme/tokens';

/** Completion state only. Role-specific private areas are outside this module. */
export function AuthenticatedNotice() {
  const { session, signOut, busy, error } = useSession();
  if (!session) return null;
  return <AuthLayout title={`Bonjour, ${session.user.firstName}`} subtitle="Vous êtes connecté à votre compte MagicPro.">
    <Ionicons name="checkmark-circle-outline" size={56} color={colors.teal} accessible={false} />
    <MessageBanner tone="success" message="Connexion réussie" />
    <AppText>{session.user.email}</AppText>
    <MessageBanner message={error} />
    <Button title="Se déconnecter" variant="secondary" onPress={signOut} loading={busy} />
  </AuthLayout>;
}
