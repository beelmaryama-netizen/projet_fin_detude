import { ClientLayout } from '../components/ClientLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { StatusChip } from '../../../components/StatusChip';
import { MessageBanner } from '../../../components/MessageBanner';
import { AsyncState, EmptyState } from '../../../components/AsyncState';
import { useClientQuery, useClientMutation, errorMessage } from '../hooks/useClientData';
import { notificationService } from '../services/clientServices';
import { dateLabel } from '../services/clientFormatters';
import type { ClientNotification } from '../types/client';
import type { ClientScreenProps } from '../../../navigation/types';
export function NotificationsScreen({ navigation }: ClientScreenProps<'Notifications'>) {
  const query = useClientQuery('notifications', notificationService.list);
  const mark = useClientMutation((user, id: string | undefined) => notificationService.markRead(user, id));
  const open = (item: ClientNotification) => {
    if (!item.read) mark.mutate(item.id);
    if (item.target.kind === 'request') navigation.navigate('RequestDetails', { id: item.target.id });
    else if (item.target.kind === 'quote') navigation.navigate('QuoteDetails', { id: item.target.id });
    else navigation.navigate('ReservationDetails', { id: item.target.id });
  };
  return <ClientLayout title="Notifications" subtitle="Les nouvelles de vos demandes et rendez-vous." onBack={() => navigation.goBack()} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <Button title="Tout marquer comme lu" variant="secondary" disabled={!query.data?.some(item => !item.read)} loading={mark.isPending} onPress={() => mark.mutate(undefined)} />
    <MessageBanner message={mark.error ? errorMessage(mark.error) : undefined} />
    <AsyncState query={query}>{query.data?.length ? query.data.map(item => <Card key={item.id}><StatusChip label={item.read ? 'Lue' : 'Non lue'} /><AppText variant="heading">{item.title}</AppText><AppText>{item.text}</AppText><AppText variant="caption">{dateLabel(item.createdAt)}</AppText><Button title="Consulter" variant="secondary" onPress={() => open(item)} /></Card>) : <EmptyState title="Aucune notification" description="Nous vous informerons ici des changements de votre dossier." />}</AsyncState>
  </ClientLayout>;
}
