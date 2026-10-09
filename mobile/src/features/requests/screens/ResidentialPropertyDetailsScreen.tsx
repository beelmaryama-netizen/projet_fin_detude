import { StyleSheet, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { ControlledField } from '../../../components/ControlledField';
import { NumberStepper } from '../../../components/NumberStepper';
import { SelectionCard } from '../../../components/SelectionCard';
import { colors, spacing } from '../../../theme/tokens';
import type { ClientScreenProps } from '../../../navigation/types';
import { useResidentialDetails } from '../hooks/useResidentialDetails';
import { RequestProgress } from '../components/RequestProgress';
import { RequestPhotoPicker } from '../components/RequestPhotoPicker';
import { MAX_DESCRIPTION_LENGTH } from '../types/request';

const propertyOptions = [
  { value: 'APARTMENT', title: 'Appartement', icon: 'business-outline' },
  { value: 'CONDO', title: 'Condo', icon: 'grid-outline' },
  { value: 'HOUSE', title: 'Maison', icon: 'home-outline' },
] as const;
export function ResidentialPropertyDetailsScreen({ navigation }: ClientScreenProps<'ResidentialPropertyDetailsScreen'>) {
  const details = useResidentialDetails(navigation);
  const description = details.form.watch('description');
  if (!details.ready) return null;
  return <AuthLayout title="Détails du logement" subtitle="Aidez-nous à mieux comprendre votre espace pour vous offrir un service adapté."
    progress={<RequestProgress activeStep={2} />} onBack={() => navigation.goBack()}>
    <Controller control={details.form.control} name="propertyType" render={({ field, fieldState }) => <View style={styles.group}>
      <AppText variant="label">Type de logement</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel="Type de logement" style={styles.options}>
        {propertyOptions.map(option => <SelectionCard key={option.value} compact {...option} selected={field.value === option.value} onPress={() => { field.onChange(option.value); field.onBlur(); }} />)}
      </View>
      {fieldState.error && <AppText variant="caption" accessibilityLiveRegion="polite" style={styles.error}>{fieldState.error.message}</AppText>}
    </View>} />
    <View style={styles.counts}>
      {([{ name: 'bedrooms', label: 'Nombre de chambres', min: 0 }, { name: 'bathrooms', label: 'Nombre de salles de bain', min: 1 }, { name: 'floors', label: 'Nombre d’étages', min: 1 }] as const).map(item =>
        <Controller key={item.name} control={details.form.control} name={item.name} render={({ field }) => <View style={styles.count}>
          <NumberStepper label={item.label} value={field.value} min={item.min} onChange={field.onChange} />
        </View>} />)}
    </View>
    <ControlledField control={details.form.control} name="areaSqft" label="Superficie approximative (pi²)" placeholder="Ex. : 1200" keyboardType="decimal-pad" maxLength={10} hint="Une estimation suffit. Superficie en pieds carrés." />
    <Controller control={details.form.control} name="hasPets" render={({ field, fieldState }) => <View style={styles.group}>
      <AppText variant="label">Présence d’animaux</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel="Présence d’animaux" style={styles.options}>
        <SelectionCard compact title="Oui" selected={field.value === true} onPress={() => { field.onChange(true); field.onBlur(); }} />
        <SelectionCard compact title="Non" selected={field.value === false} onPress={() => { field.onChange(false); field.onBlur(); }} />
      </View>
      {fieldState.error && <AppText variant="caption" accessibilityLiveRegion="polite" style={styles.error}>{fieldState.error.message}</AppText>}
    </View>} />
    <View style={styles.group}>
      <ControlledField control={details.form.control} name="description" label="Description de ce que vous souhaitez faire" placeholder="Ex. : cuisine et salles de bain prioritaires…" multiline textAlignVertical="top" maxLength={MAX_DESCRIPTION_LENGTH} style={styles.description} />
      <AppText variant="caption" style={styles.counter}>{description.length}/{MAX_DESCRIPTION_LENGTH}</AppText>
    </View>
    <RequestPhotoPicker />
    <Button title="Continuer" icon="arrow-forward" onPress={() => void details.continueRequest()} />
  </AuthLayout>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.sm }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, count: { flexGrow: 1, flexBasis: '42%', minWidth: 125 },
  error: { color: colors.danger }, description: { minHeight: 120 }, counter: { textAlign: 'right', color: colors.muted },
});
