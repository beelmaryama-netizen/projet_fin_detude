import { View } from 'react-native';
import { Controller } from 'react-hook-form';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { ControlledField } from '../../../components/ControlledField';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { SelectionCard } from '../../../components/SelectionCard';
import { AsyncState } from '../../../components/AsyncState';
import { MessageBanner } from '../../../components/MessageBanner';
import { RequestProgress } from '../components/RequestProgress';
import { useSchedulePreferences } from '../hooks/useSchedulePreferences';
import { useClientQuery } from '../../client/hooks/useClientData';
import { addressService } from '../../client/services/clientServices';
import { addressLabel, slotLabels } from '../../client/services/clientFormatters';
import { spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/ThemeProvider';
import type { ClientScreenProps } from '../../../navigation/types';
export function ResidentialSchedulePreferencesScreen({ navigation }: ClientScreenProps<'ResidentialSchedulePreferences'>) {
  const { colors } = useAppTheme();

  const state = useSchedulePreferences(navigation); const addresses = useClientQuery('addresses', addressService.list);
  if (!state.validDetails) return null;
  return <AuthLayout showFormLogo title="Date et préférences" subtitle="Proposez vos disponibilités. Notre équipe confirmera le rendez-vous après votre acceptation de l’offre." onBack={() => navigation.goBack()} progress={<RequestProgress professional={state.professional} activeStep={3} />}>
    {state.availabilityFields.fields.map((field, index) => <Card key={field.id}>
      <AppText variant="heading">Disponibilité {index + 1}</AppText>
      <ControlledField control={state.form.control} name={`availabilities.${index}.date`} label={`Date souhaitée ${index + 1}`} placeholder="AAAA-MM-JJ" maxLength={10} keyboardType="numbers-and-punctuation" hint="À partir de demain. Exemple : 2026-12-15." />
      <Controller control={state.form.control} name={`availabilities.${index}.slot`} render={({ field: slot, fieldState }) => <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup" accessibilityLabel={`Plage horaire ${index + 1}`}>
        {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map(value => <SelectionCard key={value} title={slotLabels[value]} selected={slot.value === value} onPress={() => { slot.onChange(value); slot.onBlur(); }} />)}
        {fieldState.error && <AppText style={{ color: colors.danger }}>{fieldState.error.message}</AppText>}
      </View>} />
      {index > 0 && <Button title="Retirer la deuxième disponibilité" variant="link" onPress={() => state.availabilityFields.remove(index)} />}
    </Card>)}
    <MessageBanner message={state.form.formState.errors.availabilities?.root?.message ?? state.form.formState.errors.availabilities?.message} />
    {state.availabilityFields.fields.length < 2 && <Button title="Ajouter une deuxième disponibilité" variant="secondary" onPress={() => state.availabilityFields.append({ date: '', slot: '' })} />}
    {state.professional ? <Card><AppText variant="heading">Adresse du site</AppText><AppText>{state.siteAddress}</AppText><Button title="Modifier l’adresse du site" variant="link" onPress={() => navigation.navigate('BusinessRequest', { step: 1 })} /></Card> : <>
    <AppText variant="heading">Adresse du service</AppText>
    <AsyncState query={addresses}><Controller control={state.form.control} name="addressId" render={({ field }) => <View accessibilityRole="radiogroup" accessibilityLabel="Adresse du service" style={{ gap: spacing.sm }}>
      {(addresses.data ?? []).map(address => <SelectionCard key={address.id} title={`${address.label}${address.isDefault ? ' · Par défaut' : ''}`} description={addressLabel(address)} selected={field.value === address.id} onPress={() => field.onChange(address.id)} />)}
      <SelectionCard title="Je préciserai l’adresse avec l’équipe" selected={!field.value} onPress={() => field.onChange('')} />
    </View>} /></AsyncState>
    <Button title="Gérer mes adresses" variant="link" onPress={() => navigation.navigate('MyAddresses')} />
    </>}
    <ControlledField control={state.form.control} name="instructions" label="Instructions particulières" multiline maxLength={1000} style={{ minHeight: 100 }} />
    <ControlledField control={state.form.control} name="accessNotes" label="Notes d’accès (facultatif)" multiline maxLength={500} />
    <Button title="Continuer" onPress={() => void state.continueRequest()} />
  </AuthLayout>;
}
