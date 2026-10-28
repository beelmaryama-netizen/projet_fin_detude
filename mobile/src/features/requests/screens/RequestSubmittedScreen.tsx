import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { useAppTheme } from '../../../theme/ThemeProvider';
import type { ClientScreenProps } from '../../../navigation/types';
export function RequestSubmittedScreen({ navigation, route }: ClientScreenProps<'RequestSubmitted'>) {
  const { colors } = useAppTheme();

  return <AuthLayout title="Demande envoyée" subtitle="Votre demande a bien été transmise à l’équipe MagicPro.">
    <Ionicons name="checkmark-circle" size={64} color={colors.teal} accessible={false} />
    <AppText>Une offre vous sera envoyée après analyse de votre demande.</AppText><AppText variant="label">Référence : {route.params.id}</AppText>
    <Button title="Voir ma demande" onPress={() => navigation.replace('RequestDetails', { id: route.params.id })} />
    <Button title="Retour à l’accueil" variant="secondary" onPress={() => navigation.popToTop()} />
  </AuthLayout>;
}
