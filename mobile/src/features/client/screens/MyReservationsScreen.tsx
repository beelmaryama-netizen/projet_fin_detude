import { useState } from 'react';
import { ClientLayout } from '../components/ClientLayout';
import { ReservationCard } from '../components/ReservationCard';
import { AsyncState, EmptyState } from '../../../components/AsyncState';
import { FilterTabs } from '../../../components/FilterTabs';
import { useClientQuery } from '../hooks/useClientData';
import { reservationService } from '../services/clientServices';
import { reservationGroup } from '../services/clientFormatters';
import type { ClientTabScreenProps } from '../../../navigation/types';
const filters = [{ value: 'upcoming', label: 'À venir' }, { value: 'past', label: 'Passées' }, { value: 'cancelled', label: 'Annulées' }] as const;
export function MyReservationsScreen({ navigation }: ClientTabScreenProps<'ClientReservations'>) {
  const query = useClientQuery('reservations', reservationService.list); const [filter, setFilter] = useState<string>('upcoming');
  const items = (query.data ?? []).filter(item => reservationGroup(item) === filter).sort((a, b) => filter === 'past' ? b.startAt.localeCompare(a.startAt) : a.startAt.localeCompare(b.startAt));
  return <ClientLayout title="Mes réservations" subtitle="Consultez et gérez vos rendez-vous." onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <FilterTabs value={filter} options={filters} onChange={setFilter} />
    <AsyncState query={query}>{items.length ? items.map(item => <ReservationCard key={item.id} reservation={item} onPress={() => navigation.navigate('ReservationDetails', { id: item.id })} />) : <EmptyState title="Aucune réservation" description="Aucun rendez-vous dans cette catégorie." />}</AsyncState>
  </ClientLayout>;
}
