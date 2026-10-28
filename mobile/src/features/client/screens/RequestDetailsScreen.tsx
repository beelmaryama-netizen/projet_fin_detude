import { ClientLayout } from '../components/ClientLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { StatusChip } from '../../../components/StatusChip';
import { MessageBanner } from '../../../components/MessageBanner';
import { AsyncState } from '../../../components/AsyncState';
import { RequestSummary } from '../../requests/components/RequestSummary';
import { useClientQuery } from '../hooks/useClientData';
import { quoteService, requestService } from '../services/clientServices';
import { dateLabel, requestStatusLabels, quoteStatusLabels, effectiveQuoteStatus } from '../services/clientFormatters';
import type { ClientScreenProps } from '../../../navigation/types';
export function RequestDetailsScreen({ navigation, route }: ClientScreenProps<'RequestDetails'>) {
  const query = useClientQuery(`request/${route.params.id}`, user => requestService.get(user, route.params.id));
  const quotes = useClientQuery('quotes', quoteService.list); const request = query.data;
  const associated = (quotes.data ?? []).filter(item => item.requestId === route.params.id);
  return <ClientLayout title="Ma demande" subtitle={route.params.id} onBack={() => navigation.goBack()} onRefresh={() => { void query.refetch(); void quotes.refetch(); }} refreshing={query.isRefetching || quotes.isRefetching}>
    <AsyncState query={query}>{request && <>
      <StatusChip label={requestStatusLabels[request.status]} />
      <RequestSummary details={request} photos={request.photos} schedule={request.schedule} address={request.address} />
      <Card><AppText variant="heading">Historique</AppText>{request.history.map((entry, index) => <AppText key={index}>{dateLabel(entry.at)} · {entry.label}</AppText>)}</Card>
      <AsyncState query={quotes}>{associated.length ? associated.map(quote => <Card key={quote.id}><AppText variant="heading">Offre associée</AppText><StatusChip label={quoteStatusLabels[effectiveQuoteStatus(quote)]} /><Button title="Voir l’offre" onPress={() => navigation.navigate('QuoteDetails', { id: quote.id })} /></Card>) : <MessageBanner tone="info" message={['NEW', 'IN_REVIEW', 'QUOTED'].includes(request.status) ? 'Votre demande est en cours d’analyse.' : 'Aucune offre associée à cette demande.'} />}</AsyncState>
    </>}</AsyncState>
  </ClientLayout>;
}
