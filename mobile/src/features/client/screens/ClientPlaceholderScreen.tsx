import { AuthLayout } from '../../auth/components/AuthLayout';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { categoryTitle } from '../../requests/data/requestCategories';
import type { ClientScreenProps } from '../../../navigation/types';

export function ClientPlaceholderScreen({ navigation, route }: ClientScreenProps<'RequestFlowPlaceholder'>) {
  return <AuthLayout title={categoryTitle(route.params.category)} subtitle="La suite de ce parcours sera disponible prochainement." onBack={() => navigation.goBack()}>
    <MessageBanner tone="info" message="Votre brouillon est conservé pendant cette session. Aucune demande n’a été envoyée." />
    <Button title="Modifier ma demande" variant="secondary" onPress={() => navigation.goBack()} />
    <Button title="Retour à l’accueil" onPress={() => navigation.navigate('ClientTabs', { screen: 'ClientHomeScreen' })} />
  </AuthLayout>;
}
