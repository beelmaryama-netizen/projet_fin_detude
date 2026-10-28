import { View } from 'react-native';
import { ClientLayout } from '../components/ClientLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { MessageBanner } from '../../../components/MessageBanner';
import { AsyncState } from '../../../components/AsyncState';
import { useSession } from '../../auth/hooks/useSession';
import { useClientQuery } from '../hooks/useClientData';
import { profileService } from '../services/profileService';
import { spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/ThemeProvider';
import type { ClientTabScreenProps } from '../../../navigation/types';
export function ClientProfileScreen({ navigation }: ClientTabScreenProps<'ClientProfile'>) {
  const { colors } = useAppTheme();

  const query = useClientQuery('profile', profileService.get); const session = useSession(); const user = query.data;
  return <ClientLayout title="Profil" subtitle="Votre compte MagicPro.">
    <AsyncState query={query}>{user && <Card><View style={{ alignSelf: 'center', backgroundColor: colors.paleBlue, padding: spacing.lg, borderRadius: 48 }}><AppText variant="heading">{user.firstName[0]}{user.lastName[0]}</AppText></View><AppText variant="heading">{user.firstName} {user.lastName}</AppText><AppText>{user.email}</AppText><AppText>{user.phone || 'Téléphone non renseigné'}</AppText></Card>}</AsyncState>
    <Button title="Informations personnelles" variant="secondary" icon="person-outline" onPress={() => navigation.navigate('EditProfile')} />
    <Button title="Apparence" variant="secondary" icon="color-palette-outline" onPress={() => navigation.navigate('Appearance')} />
    <Button title="Mes adresses" variant="secondary" icon="location-outline" onPress={() => navigation.navigate('MyAddresses')} />
    <Button title="Mes offres" variant="secondary" icon="document-text-outline" onPress={() => navigation.navigate('MyQuotes')} />
    <Button title="Notifications" variant="secondary" icon="notifications-outline" onPress={() => navigation.navigate('NotificationPreferences')} />
    <Button title="Sécurité" variant="secondary" icon="shield-checkmark-outline" onPress={() => navigation.navigate('Security')} />
    <Button title="Aide / support" variant="secondary" icon="help-circle-outline" onPress={() => navigation.navigate('Support')} />
    <MessageBanner message={session.error} /><Button title="Se déconnecter" variant="secondary" loading={session.busy} onPress={session.signOut} />
  </ClientLayout>;
}
