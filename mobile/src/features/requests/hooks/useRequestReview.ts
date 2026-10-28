import { useRef } from 'react';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import { useClientMutation } from '../../client/hooks/useClientData';
import { requestService } from '../../client/services/clientServices';
import { requestSubmissionSchema } from '../schemas/scheduleSchema';
import type { ClientScreenProps } from '../../../navigation/types';
export function useRequestReview(navigation: ClientScreenProps<'RequestReview'>['navigation']) {
  const draft = useRequestDraftStore(); const lock = useRef(false);
  const parsed = requestSubmissionSchema.safeParse(draft);
  const mutation = useClientMutation(requestService.create, request => {
    if (useRequestDraftStore.getState().submissionKey !== draft.submissionKey) return;
    navigation.reset({ index: 1, routes: [{ name: 'ClientTabs' }, { name: 'RequestSubmitted', params: { id: request.id } }] });
    useRequestDraftStore.getState().reset();
  });
  const submit = async () => {
    if (!parsed.success || lock.current) return;
    lock.current = true;
    try { await mutation.mutateAsync(parsed.data); } catch { /* Displayed by the mutation banner. */ } finally { lock.current = false; }
  };
  return { draft, details: parsed.success ? parsed.data : undefined, valid: parsed.success, mutation, submit };
}
