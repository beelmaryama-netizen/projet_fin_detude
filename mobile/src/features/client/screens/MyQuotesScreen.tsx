import { ClientLayout } from '../components/ClientLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { StatusChip } from '../../../components/StatusChip';
import { AsyncState, EmptyState } from '../../../components/AsyncState';
import { useClientQuery } from '../hooks/useClientData';
import { quoteService } from '../services/clientServices';
import { dateLabel, effectiveQuoteStatus, money, quoteStatusLabels } from '../services/clientFormatters';
import type { ClientScreenProps } from '../../../navigation/types';
export function MyQuotesScreen({ navigation }: ClientScreenProps<'MyQuotes'>) {
  const query = useClientQuery('quotes', quoteService.list);
  return <ClientLayout title="Mes offres" subtitle="Les propositions de l’équipe MagicPro." onBack={() => navigation.goBack()} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <AsyncState query={query}>{query.data?.length ? query.data.map(quote => <Card key={quote.id}><StatusChip label={quoteStatusLabels[effectiveQuoteStatus(quote)]} /><AppText variant="heading">{quote.serviceTitle}</AppText><AppText variant="caption">{quote.id}</AppText><AppText variant="heading">{money(quote.totalCents)}</AppText><AppText>{quote.durationHours} h · {dateLabel(quote.startAt)}</AppText><Button title="Voir l’offre" onPress={() => navigation.navigate('QuoteDetails', { id: quote.id })} /></Card>) : <EmptyState title="Aucune offre" description="Vos offres apparaîtront ici après l’analyse de vos demandes." />}</AsyncState>
  </ClientLayout>;
}
