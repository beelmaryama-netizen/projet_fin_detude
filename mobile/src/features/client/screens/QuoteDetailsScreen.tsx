import { View } from 'react-native';
import { ClientLayout } from '../components/ClientLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { StatusChip } from '../../../components/StatusChip';
import { MessageBanner } from '../../../components/MessageBanner';
import { FormField } from '../../../components/FormField';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { AsyncState } from '../../../components/AsyncState';
import { useQuoteDetails } from '../hooks/useQuoteDetails';
import { errorMessage } from '../hooks/useClientData';
import { dateLabel, effectiveQuoteStatus, formatReservation, money, quoteStatusLabels } from '../services/clientFormatters';
import { spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/ThemeProvider';
import type { ClientScreenProps } from '../../../navigation/types';
export function QuoteDetailsScreen({ navigation, route }: ClientScreenProps<'QuoteDetails'>) {
  const { colors } = useAppTheme();

  const state = useQuoteDetails(route.params.id, navigation); const quote = state.query.data;
  const pending = quote && effectiveQuoteStatus(quote) === 'PENDING';
  const busy = state.accept.isPending || state.reject.isPending;
  return <ClientLayout title="Offre reçue" subtitle="Voici le détail de l’offre pour votre demande." onBack={() => navigation.goBack()} onRefresh={() => void state.query.refetch()} refreshing={state.query.isRefetching}>
    <AsyncState query={state.query}>{quote && <>
      <StatusChip label={quoteStatusLabels[effectiveQuoteStatus(quote)]} />
      <Card><AppText variant="heading">{quote.serviceTitle}</AppText><AppText>{quote.address}</AppText><AppText>{dateLabel(quote.startAt)} · {formatReservation({ ...quote, timeZone: 'America/Toronto' }).time}</AppText><AppText>Durée estimée : {quote.durationHours} h</AppText><AppText variant="caption">{quote.id} · Valable jusqu’au {dateLabel(quote.expiresAt)}</AppText></Card>
      <Card><AppText variant="heading">Détails des prix</AppText>{[...quote.lines, ...quote.taxes].map(line => <View key={line.label} style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}><AppText style={{ flex: 1, minWidth: 140 }}>{line.label}</AppText><AppText variant="label">{money(line.cents)}</AppText></View>)}<AppText variant="heading" style={{ color: colors.primary }}>Total : {money(quote.totalCents)}</AppText><AppText variant="caption">Montants de démonstration en dollars canadiens. Aucun paiement ne sera effectué.</AppText></Card>
      <MessageBanner tone="info" message={quote.adminNote} />
      {quote.rejectionReason && <AppText>Motif du refus : {quote.rejectionReason}</AppText>}
      {pending && <><Button title="Accepter l’offre" onPress={() => state.open('accept')} /><Button title="Refuser" variant="secondary" onPress={() => state.open('reject')} /></>}
      <Button title="Voir ma demande" variant="link" onPress={() => navigation.navigate('RequestDetails', { id: quote.requestId })} />
    </>}</AsyncState>
    <ConfirmModal visible={state.dialog !== null} title={state.dialog === 'accept' ? 'Accepter cette offre ?' : 'Refuser cette offre ?'} message={state.dialog === 'accept' ? `Vous acceptez le total de ${quote ? money(quote.totalCents) : ''}. Le rendez-vous restera en attente de confirmation par MagicPro.` : 'La demande restera consultable et pourra être réanalysée.'} confirmLabel={state.dialog === 'accept' ? 'Confirmer l’acceptation' : 'Confirmer le refus'} busy={busy} onCancel={state.close} onConfirm={() => { if (!busy) { if (state.dialog === 'accept') state.accept.mutate(); else state.reject.mutate(state.reason); } }} error={state.accept.error || state.reject.error ? errorMessage(state.accept.error ?? state.reject.error) : undefined}>
      {state.dialog === 'reject' && <FormField label="Motif (facultatif)" value={state.reason} onChangeText={state.setReason} multiline maxLength={500} />}
    </ConfirmModal>
  </ClientLayout>;
}
