import { useEffect } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { ControlledField } from '../../../components/ControlledField';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { SelectionCard } from '../../../components/SelectionCard';
import { MessageBanner } from '../../../components/MessageBanner';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import type { ClientScreenProps } from '../../../navigation/types';
import type { RequestPreferences } from '../types/request';
import { preferenceSchema } from '../schemas/preferenceSchema';
import { residentialDetailsSchema } from '../schemas/requestSchemas';
import { RequestProgress } from '../components/RequestProgress';
import { colors, spacing } from '../../../theme/tokens';

export function RequestPreferencesScreen({ navigation }: ClientScreenProps<'RequestNextStep'>) {
  const draft = useRequestDraftStore();
  const form = useForm<RequestPreferences>({ defaultValues: draft.preferences, resolver: zodResolver(preferenceSchema()), mode: 'onTouched' });
  const ready = draft.category === 'RESIDENTIAL' && residentialDetailsSchema.safeParse(draft.residential).success;
  useEffect(() => { if (!ready) navigation.replace('ResidentialPropertyDetailsScreen'); }, [ready, navigation]);
  useEffect(() => {
    const subscription = form.watch(() => draft.updatePreferences(form.getValues()));
    return () => subscription.unsubscribe();
  }, [form, draft.updatePreferences]);
  if (!ready) return null;
  return <AuthLayout title="Date et préférences" subtitle="Quand souhaitez-vous recevoir le service ?"
    progress={<RequestProgress activeStep={3} />} onBack={() => navigation.goBack()}>
    <MessageBanner tone="info" message="La date et le créneau sont des souhaits. Aucune disponibilité n’est garantie dans cette démonstration." />
    <ControlledField control={form.control} name="date" label="Date souhaitée" placeholder="AAAA-MM-JJ" hint="Exemple : 2026-12-15" maxLength={10} />
    <Controller control={form.control} name="timeSlot" render={({ field, fieldState }) => <View style={{ gap: spacing.sm }}>
      <AppText variant="label">Créneau souhaité</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel="Créneau souhaité" style={{ gap: spacing.sm }}>
        {([{ value: 'MORNING', title: 'Matin', description: 'Entre 8 h et 12 h' }, { value: 'AFTERNOON', title: 'Après-midi', description: 'Entre 12 h et 17 h' }] as const).map(option =>
          <SelectionCard key={option.value} {...option} selected={field.value === option.value} onPress={() => { field.onChange(option.value); field.onBlur(); }} />)}
      </View>
      {fieldState.error && <AppText accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{fieldState.error.message}</AppText>}
    </View>} />
    <ControlledField control={form.control} name="notes" label="Préférences supplémentaires (facultatif)" placeholder="Ex. : privilégier des produits sans parfum…" multiline maxLength={500} />
    <Button title="Voir le récapitulatif" onPress={() => void form.handleSubmit(values => { draft.updatePreferences(values); navigation.navigate('RequestReview'); })()} />
  </AuthLayout>;
}
