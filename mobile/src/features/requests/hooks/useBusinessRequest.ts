import { useCallback, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import { businessDetailsSchema, businessSchemaFor } from '../schemas/businessSchema';
import { isBusinessCategory, type BusinessDetails } from '../types/business';
import type { ClientScreenProps } from '../../../navigation/types';

const stepFields: FieldPath<BusinessDetails>[][] = [
  ['establishmentType'], ['companyName', 'areaSqft', 'floors', 'siteAddress'], ['zones'],
  ['description', 'frequency', 'customFrequency', 'preferredHours'], ['equipment', 'restrictedAreas', 'allowedProducts', 'constraints'], [],
];
export function useBusinessRequest({ navigation, route }: ClientScreenProps<'BusinessRequest'>) {
  const draft = useRequestDraftStore();
  const form = useForm<BusinessDetails>({ defaultValues: draft.business, resolver: zodResolver(isBusinessCategory(draft.category) ? businessSchemaFor(draft.category) : businessDetailsSchema), mode: 'onTouched' });
  const step = route.params.step;
  const ready = isBusinessCategory(draft.category);
  const formCategory = useRef(draft.category);
  useEffect(() => {
    if (formCategory.current === draft.category) return;
    formCategory.current = draft.category;
    form.reset(draft.business);
  }, [draft.category, draft.business, form]);
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) return false;
      navigation.setParams({ step: (step - 1) as 0 | 1 | 2 | 3 | 4 });
      return true;
    });
    return () => listener.remove();
  }, [navigation, step]));
  useEffect(() => { if (!ready) navigation.replace('RequestTypeScreen'); }, [ready, navigation]);
  useEffect(() => { const sub = form.watch(() => useRequestDraftStore.getState().updateBusiness(form.getValues())); return () => sub.unsubscribe(); }, [form]);
  const continueRequest = async () => {
    if (!(await form.trigger(stepFields[step], { shouldFocus: true }))) return;
    if (step < 5) { navigation.setParams({ step: (step + 1) as 1 | 2 | 3 | 4 | 5 }); return; }
    if (!(await form.trigger())) { navigation.setParams({ step: 0 }); return; }
    navigation.navigate('ResidentialSchedulePreferences');
  };
  return { form, ready, step, category: draft.category, continueRequest,
    back: () => step > 0 ? navigation.setParams({ step: (step - 1) as 0 | 1 | 2 | 3 | 4 }) : navigation.goBack() };
}
