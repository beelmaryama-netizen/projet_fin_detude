import { ClientLayout } from '../components/ClientLayout';
import { AppearanceSettings } from '../../../components/AppearanceSettings';
import type { ClientScreenProps } from '../../../navigation/types';

export function AppearanceScreen({ navigation }: ClientScreenProps<'Appearance'>) {
  return <ClientLayout title="Apparence" subtitle="Choisissez le thème de l’application. Votre choix est appliqué immédiatement." onBack={() => navigation.goBack()}>
    <AppearanceSettings />
  </ClientLayout>;
}
