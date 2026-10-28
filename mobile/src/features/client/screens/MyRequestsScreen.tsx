import { useState } from 'react';
import { ClientLayout } from '../components/ClientLayout';
import { Card } from '../../../components/Card';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { StatusChip } from '../../../components/StatusChip';
import { FilterTabs } from '../../../components/FilterTabs';
import { AsyncState, EmptyState } from '../../../components/AsyncState';
import { useClientQuery } from '../hooks/useClientData';
import { requestService } from '../services/clientServices';
import { addressLabel, dateLabel, requestStatusLabels } from '../services/clientFormatters';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import type { ClientTabScreenProps } from '../../../navigation/types';
const filters = [{ value: 'all', label: 'Toutes' }, { value: 'review', label: 'En analyse' }, { value: 'quotes', label: 'Offre reçue' }, { value: 'accepted', label: 'Acceptées' }, { value: 'closed', label: 'Fermées' }] as const;
export function MyRequestsScreen({ navigation }: ClientTabScreenProps<'ClientRequests'>) {
  const query = useClientQuery('requests', requestService.list); const [filter, setFilter] = useState<string>('all');
  const category = useRequestDraftStore(state => state.category);
  const requests = (query.data ?? []).filter(item => filter === 'all' || (filter === 'review' && ['NEW', 'IN_REVIEW'].includes(item.status)) || (filter === 'quotes' && item.status === 'QUOTED') || (filter === 'accepted' && item.status === 'ACCEPTED') || (filter === 'closed' && ['CANCELLED', 'CLOSED'].includes(item.status)));
  return <ClientLayout title="Mes demandes" subtitle="Suivez vos demandes et retrouvez vos offres." onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <Button title="Mes offres" variant="secondary" onPress={() => navigation.navigate('MyQuotes')} />
    {category && <Card><AppText variant="heading">Une demande en préparation</AppText><AppText>Votre brouillon n’a pas encore été envoyé.</AppText><Button title="Reprendre ma demande" onPress={() => navigation.navigate('RequestTypeScreen')} /></Card>}
    <FilterTabs options={filters} value={filter} onChange={setFilter} />
    <AsyncState query={query}>{requests.length ? requests.map(request => <Card key={request.id}>
      <StatusChip label={requestStatusLabels[request.status]} /><AppText variant="heading">{request.serviceTitle}</AppText><AppText variant="caption">Créée le {dateLabel(request.createdAt)} · {request.id}</AppText>
      <AppText>{request.category === 'RESIDENTIAL' ? addressLabel(request.address) : request.business.siteAddress}</AppText><AppText numberOfLines={3}>{(request.category === 'RESIDENTIAL' ? request.residential.description : request.business.description) || 'Demande de nettoyage.'}</AppText>
      <Button title="Voir les détails" variant="secondary" onPress={() => navigation.navigate('RequestDetails', { id: request.id })} />
    </Card>) : <EmptyState title="Aucune demande" description="Aucune demande ne correspond à ce filtre." action="Demander un service" onAction={() => navigation.navigate('RequestTypeScreen')} />}</AsyncState>
  </ClientLayout>;
}
