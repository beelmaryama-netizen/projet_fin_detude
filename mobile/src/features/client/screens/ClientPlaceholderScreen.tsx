import { AuthLayout } from '../../auth/components/AuthLayout';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { categoryTitle } from '../../requests/data/requestCategories';
import { RequestProgress } from '../../requests/components/RequestProgress';
import type { ClientScreenProps } from '../../../navigation/types';

export function ClientPlaceholderScreen({ navigation, route }: ClientScreenProps<'RequestFlowPlaceholder' | 'RequestNextStep' | 'Notifications'>) {
  const next = route.name === 'RequestNextStep';
  const notifications = route.name === 'Notifications';
  const category = route.params && 'category' in route.params ? route.params.category : null;
  return <AuthLayout title={notifications ? 'Notifications' : next ? 'Date et préférences' : categoryTitle(category)}
    subtitle={notifications ? 'Vos informations importantes apparaîtront ici.' : 'La suite de ce parcours sera disponible prochainement.'}
    progress={next ? <RequestProgress activeStep={3} /> : undefined} onBack={() => navigation.goBack()}>
    <MessageBanner tone="info" message={notifications ? 'Aucune notification pour le moment.' : 'Votre brouillon est conservé pendant cette session. Aucune demande n’a été envoyée.'} />
    {!notifications && <Button title="Modifier ma demande" variant="secondary" onPress={() => navigation.goBack()} />}
    <Button title="Retour à l’accueil" onPress={() => navigation.navigate('ClientTabs', { screen: 'ClientHomeScreen' })} />
  </AuthLayout>;
}
