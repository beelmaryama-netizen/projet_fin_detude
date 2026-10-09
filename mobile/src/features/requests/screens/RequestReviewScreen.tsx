import { useEffect } from 'react';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import type { ClientScreenProps } from '../../../navigation/types';
import { preferenceSchema } from '../schemas/preferenceSchema';
import { residentialDetailsSchema } from '../schemas/requestSchemas';
import { RequestProgress } from '../components/RequestProgress';

const propertyNames = { APARTMENT: 'Appartement', CONDO: 'Condo', HOUSE: 'Maison', '': '' };
export function RequestReviewScreen({ navigation }: ClientScreenProps<'RequestReview'>) {
  const draft = useRequestDraftStore();
  const propertyReady = draft.category === 'RESIDENTIAL' && residentialDetailsSchema.safeParse(draft.residential).success;
  const preferencesReady = preferenceSchema().safeParse(draft.preferences).success;
  useEffect(() => {
    if (!propertyReady) navigation.replace('ResidentialPropertyDetailsScreen');
    else if (!preferencesReady) navigation.replace('RequestNextStep');
  }, [propertyReady, preferencesReady, navigation]);
  if (!propertyReady || !preferencesReady) return null;
  const details = draft.residential;
  return <AuthLayout title="Récapitulatif de la demande" subtitle="Vérifiez les informations de votre brouillon."
    progress={<RequestProgress activeStep={4} />} onBack={() => navigation.goBack()}>
    <MessageBanner tone="info" message="Démonstration : votre demande n’a pas été envoyée. Ce brouillon reste en mémoire jusqu’à la déconnexion ou au rechargement." />
    <AppText variant="heading">Service résidentiel</AppText>
    <AppText>{propertyNames[details.propertyType]} · {details.areaSqft} pi²</AppText>
    <AppText>{details.bedrooms} chambre(s) · {details.bathrooms} salle(s) de bain · {details.floors} étage(s)</AppText>
    <AppText>Animaux : {details.hasPets ? 'Oui' : 'Non'}</AppText>
    {details.description ? <AppText>Description : {details.description}</AppText> : null}
    <AppText>Photos jointes au brouillon : {draft.photos.length}</AppText>
    <Button title="Modifier le logement" variant="secondary" onPress={() => navigation.navigate('ResidentialPropertyDetailsScreen')} />
    <AppText variant="heading">Date et préférences</AppText>
    <AppText>Date souhaitée : {draft.preferences.date}</AppText>
    <AppText>{draft.preferences.timeSlot === 'MORNING' ? 'Matin, entre 8 h et 12 h' : 'Après-midi, entre 12 h et 17 h'}</AppText>
    {draft.preferences.notes ? <AppText>{draft.preferences.notes}</AppText> : null}
    <Button title="Modifier la date et les préférences" variant="secondary" onPress={() => navigation.navigate('RequestNextStep')} />
    <Button title="Conserver le brouillon et revenir à mes demandes" onPress={() => navigation.popTo('ClientTabs', { screen: 'ClientRequests' })} />
  </AuthLayout>;
}
