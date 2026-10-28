import { useState } from 'react';
import { useClientMutation, useClientQuery } from './useClientData';
import { quoteService } from '../services/clientServices';
import type { ClientScreenProps } from '../../../navigation/types';
export function useQuoteDetails(id: string, navigation: ClientScreenProps<'QuoteDetails'>['navigation']) {
  const query = useClientQuery(`quote/${id}`, user => quoteService.get(user, id));
  const [dialog, setDialog] = useState<'accept' | 'reject' | null>(null); const [reason, setReason] = useState('');
  const accept = useClientMutation((user, _: void) => quoteService.accept(user, id), reservation => { setDialog(null); navigation.replace('ReservationDetails', { id: reservation.id }); });
  const reject = useClientMutation((user, value: string) => quoteService.reject(user, id, value), () => { setDialog(null); setReason(''); });
  return { query, dialog, reason, setReason, accept, reject, open: (value: 'accept' | 'reject') => { accept.reset(); reject.reset(); setDialog(value); }, close: () => setDialog(null) };
}
