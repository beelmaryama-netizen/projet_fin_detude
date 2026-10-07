import { useMemo } from 'react';
import { ClientLayout } from '../components/ClientLayout';
import { ReservationCard } from '../components/ReservationCard';
import { AppText } from '../../../components/AppText';
import { useAuthStore } from '../../../store/authStore';
import { getUpcomingReservations } from '../services/mockClientService';
import type { ClientScreenProps } from '../../../navigation/types';

export function ReservationDetailsScreen({ navigation, route }: ClientScreenProps<'ReservationDetails'>) {
  const userId = useAuthStore(state => state.session?.user.id ?? '');
  const reservation = useMemo(() => getUpcomingReservations(userId).find(item => item.id === route.params.id), [userId, route.params.id]);
  return <ClientLayout title="Ma réservation" subtitle="Les détails de votre rendez-vous." onBack={() => navigation.goBack()} bottomSafeArea>
    {reservation ? <ReservationCard reservation={reservation} /> : <AppText>Cette réservation n’est pas disponible.</AppText>}
  </ClientLayout>;
}
