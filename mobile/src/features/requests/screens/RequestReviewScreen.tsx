import { AuthLayout } from '../../auth/components/AuthLayout';
import { RequestProgress } from '../components/RequestProgress';
import { RequestSummary } from '../components/RequestSummary';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { AsyncState } from '../../../components/AsyncState';
import { useRequestReview } from '../hooks/useRequestReview';
import { useClientQuery, errorMessage } from '../../client/hooks/useClientData';
import { addressService } from '../../client/services/clientServices';
import type { ClientScreenProps } from '../../../navigation/types';
export function RequestReviewScreen({ navigation }: ClientScreenProps<'RequestReview'>) {
  const state = useRequestReview(navigation); const addresses = useClientQuery('addresses', addressService.list);
  const { draft, mutation } = state;
  const address = addresses.data?.find(item => item.id === draft.schedule.addressId) ?? null;
  const professional = draft.category !== 'RESIDENTIAL';
  const missingAddress = !professional && !!draft.schedule.addressId && !address;
  return <AuthLayout showFormLogo title="Vérifiez votre demande" subtitle="Vérifiez ces informations avant de les transmettre à l’équipe MagicPro." onBack={mutation.isPending ? undefined : () => navigation.goBack()} progress={<RequestProgress professional={professional} activeStep={4} />}>
    {!state.valid && <MessageBanner message="Votre brouillon est incomplet ou une disponibilité est passée. Modifiez les informations avant l’envoi." />}
    {professional ? state.details && <RequestSummary details={state.details} photos={draft.photos} schedule={draft.schedule} address={null} /> : <AsyncState query={addresses}>{state.details && <RequestSummary details={state.details} photos={draft.photos} schedule={draft.schedule} address={address} />}</AsyncState>}
    {missingAddress && !addresses.isPending && <MessageBanner message="L’adresse sélectionnée a été supprimée. Choisissez une autre adresse dans Date et préférences." />}
    <Button title={professional ? "Modifier l’établissement" : "Modifier les détails du logement"} variant="secondary" disabled={mutation.isPending} onPress={() => professional ? navigation.navigate('BusinessRequest', { step: 0 }) : navigation.navigate('ResidentialPropertyDetailsScreen')} />
    <Button title={professional ? 'Modifier les pièces jointes' : 'Modifier les photos'} variant="link" disabled={mutation.isPending} onPress={() => professional ? navigation.navigate('BusinessRequest', { step: 5 }) : navigation.navigate('ResidentialPropertyDetailsScreen')} />
    <Button title="Modifier la disponibilité" variant="secondary" disabled={mutation.isPending} onPress={() => navigation.navigate('ResidentialSchedulePreferences')} />
    <MessageBanner message={mutation.error ? errorMessage(mutation.error) : undefined} />
    <Button title="Envoyer ma demande" loading={mutation.isPending} disabled={!state.valid || (!professional && (addresses.isPending || addresses.isError || missingAddress))} onPress={() => void state.submit()} />
  </AuthLayout>;
}
