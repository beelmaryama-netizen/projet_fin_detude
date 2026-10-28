import { businessSchemaFor } from '../schemas/businessSchema';
import { isBusinessCategory } from '../types/business';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import { scheduleSchema } from '../schemas/scheduleSchema';
import type { SchedulePreferences } from '../types/request';
import type { ClientScreenProps } from '../../../navigation/types';
import { residentialDetailsSchema } from '../schemas/requestSchemas';
export function useSchedulePreferences(navigation: ClientScreenProps<'ResidentialSchedulePreferences'>['navigation']) {
  const draft = useRequestDraftStore();
  const form = useForm<SchedulePreferences>({ resolver: zodResolver(scheduleSchema), defaultValues: draft.schedule, mode: 'onTouched' });
  const availabilityFields = useFieldArray({ control: form.control, name: 'availabilities' });
  const validDetails = draft.category === 'RESIDENTIAL' ? residentialDetailsSchema.safeParse(draft.residential).success : isBusinessCategory(draft.category) && businessSchemaFor(draft.category).safeParse(draft.business).success;
  useEffect(() => { if (!validDetails) { if (isBusinessCategory(draft.category)) navigation.replace('BusinessRequest', { step: 0 }); else navigation.replace('ResidentialPropertyDetailsScreen'); } }, [validDetails, navigation, draft.category]);
  useEffect(() => { const subscription = form.watch(() => useRequestDraftStore.getState().updateSchedule(form.getValues())); return () => subscription.unsubscribe(); }, [form]);
  return { professional: isBusinessCategory(draft.category), siteAddress: draft.business.siteAddress, form, availabilityFields, validDetails, continueRequest: form.handleSubmit(value => { draft.updateSchedule(value); navigation.navigate('RequestReview'); }) };
}
