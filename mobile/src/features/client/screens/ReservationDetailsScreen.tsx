import { useState } from 'react';
import { ClientLayout } from '../components/ClientLayout';
import { ReservationCard } from '../components/ReservationCard';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { MessageBanner } from '../../../components/MessageBanner';
import { AsyncState } from '../../../components/AsyncState';
import { useClientQuery, useClientMutation, errorMessage } from '../hooks/useClientData';
import { reservationService } from '../services/clientServices';
import { canCancelReservation } from '../services/clientFormatters';
import type { ClientScreenProps } from '../../../navigation/types';

export function ReservationDetailsScreen({ navigation, route }: ClientScreenProps<'ReservationDetails'>) {
  const query = useClientQuery(`reservation/${route.params.id}`, user => reservationService.get(user, route.params.id));
  const reservation = query.data; const [confirm, setConfirm] = useState(false);
  const cancel = useClientMutation((user, _: void) => reservationService.cancel(user, route.params.id), () => setConfirm(false));
  return <ClientLayout title="Ma réservation" subtitle="Les détails de votre rendez-vous." onBack={() => navigation.goBack()} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <AsyncState query={query}>{reservation && <>
      {reservation.status === 'PENDING' && <MessageBanner tone="info" message="Votre offre est acceptée. L’équipe MagicPro doit encore confirmer le rendez-vous." />}
      <ReservationCard reservation={reservation} />
      <Card><AppText variant="label">Référence : {reservation.id}</AppText><AppText variant="heading">Résumé du service</AppText><AppText>{reservation.summary || reservation.serviceTitle}</AppText><AppText variant="heading">Vos instructions</AppText><AppText>{reservation.instructions || 'Aucune instruction particulière.'}</AppText></Card>
      <Button title="Voir l’offre liée" variant="secondary" onPress={() => navigation.navigate('QuoteDetails', { id: reservation.quoteId })} />
      <Button title="Voir ma demande" variant="secondary" onPress={() => navigation.navigate('RequestDetails', { id: reservation.requestId })} />
      {['PENDING', 'CONFIRMED'].includes(reservation.status) && <><AppText variant="caption">Règle de démonstration : annulation possible jusqu’à 24 heures avant le début prévu. La politique définitive reste à confirmer.</AppText>{canCancelReservation(reservation) ? <Button title="Annuler la réservation" variant="secondary" onPress={() => { cancel.reset(); setConfirm(true); }} /> : <MessageBanner tone="info" message="L’annulation dans l’application n’est plus disponible. Contactez le support." />}</>}
      <Button title="Contacter le support" variant="link" onPress={() => navigation.navigate('Support')} />
    </>}</AsyncState>
    <ConfirmModal visible={confirm} title="Annuler ce rendez-vous ?" message="Cette annulation sera enregistrée dans votre dossier. La réservation restera consultable dans les réservations annulées." confirmLabel="Confirmer l’annulation" busy={cancel.isPending} error={cancel.error ? errorMessage(cancel.error) : undefined} onCancel={() => setConfirm(false)} onConfirm={() => { if (!cancel.isPending) cancel.mutate(); }} />
  </ClientLayout>;
}
