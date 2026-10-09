import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import type { ClientScreenProps } from '../../../navigation/types';
import { residentialDetailsSchema } from '../schemas/requestSchemas';
import type { ResidentialDetails } from '../types/request';

export function useResidentialDetails(navigation: ClientScreenProps<'ResidentialPropertyDetailsScreen'>['navigation']) {
  const residential = useRequestDraftStore(state => state.residential);
  const category = useRequestDraftStore(state => state.category);
  const updateResidential = useRequestDraftStore(state => state.updateResidential);
  const form = useForm<ResidentialDetails>({ defaultValues: residential, resolver: zodResolver(residentialDetailsSchema), mode: 'onTouched' });
  useEffect(() => {
    const subscription = form.watch(() => updateResidential(form.getValues()));
    return () => subscription.unsubscribe();
  }, [form, updateResidential]);
  useEffect(() => { if (category !== 'RESIDENTIAL') navigation.replace('RequestTypeScreen'); }, [category, navigation]);
  return { form, ready: category === 'RESIDENTIAL',
    continueRequest: form.handleSubmit(details => { updateResidential(details); navigation.navigate('RequestNextStep'); }),
  };
}
