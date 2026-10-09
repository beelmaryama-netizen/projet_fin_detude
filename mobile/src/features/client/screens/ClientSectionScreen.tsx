import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { ClientLayout } from '../components/ClientLayout';
import { ReservationCard } from '../components/ReservationCard';
import { useClientHome } from '../hooks/useClientHome';
import { useSession } from '../../auth/hooks/useSession';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import { categoryTitle } from '../../requests/data/requestCategories';
import type { ClientTabScreenProps } from '../../../navigation/types';

export function ClientSectionScreen({ navigation, route }: ClientTabScreenProps<'ClientRequests' | 'ClientReservations' | 'ClientProfile'>) {
  const session = useSession();
  const home = useClientHome(navigation);
  const category = useRequestDraftStore(state => state.category);
  if (route.name === 'ClientReservations') return <ClientLayout title="Mes réservations" subtitle="Vos prochains rendez-vous.">
    {home.reservations.length ? home.reservations.map(reservation => <ReservationCard key={reservation.id} reservation={reservation} onPress={() => navigation.navigate('ReservationDetails', { id: reservation.id })} />) : <AppText>Aucune réservation à venir.</AppText>}
  </ClientLayout>;
  if (route.name === 'ClientProfile') return <ClientLayout title="Profil" subtitle="Votre compte MagicPro.">
    <AppText variant="heading">{session.session?.user.firstName} {session.session?.user.lastName}</AppText>
    <AppText>{session.session?.user.email}</AppText>
    <MessageBanner message={session.error} />
    <Button title="Se déconnecter" variant="secondary" loading={session.busy} onPress={session.signOut} />
  </ClientLayout>;
  return <ClientLayout title="Mes demandes" subtitle="Retrouvez votre demande en préparation.">
    <AppText>{category ? `Brouillon : ${categoryTitle(category)}` : 'Aucune demande pour le moment.'}</AppText>
    {category && <AppText variant="label">Votre brouillon n’a pas encore été envoyé.</AppText>}
    <Button title={category ? 'Reprendre ma demande' : 'Demander un service'} onPress={() => home.startRequest()} />
  </ClientLayout>;
}
