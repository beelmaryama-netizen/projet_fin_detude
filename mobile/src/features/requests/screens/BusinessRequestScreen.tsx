import { View } from 'react-native';
import { Controller } from 'react-hook-form';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { ControlledField } from '../../../components/ControlledField';
import { SelectionCard } from '../../../components/SelectionCard';
import { ToggleRow } from '../../../components/ToggleRow';
import { NumberStepper } from '../../../components/NumberStepper';
import { MessageBanner } from '../../../components/MessageBanner';
import { RequestProgress } from '../components/RequestProgress';
import { RequestPhotoPicker } from '../components/RequestPhotoPicker';
import { RequestDocumentPicker } from '../components/RequestDocumentPicker';
import { useBusinessRequest } from '../hooks/useBusinessRequest';
import { frequencies, isBusinessCategory } from '../types/business';
import { businessProfiles } from '../data/businessProfiles';
import { categoryTitle } from '../data/requestCategories';
import { spacing } from '../../../theme/tokens';
import type { ClientScreenProps } from '../../../navigation/types';

const titles = ['Type d’établissement', 'Informations établissement', 'Zones concernées', 'Service et fréquence', 'Contraintes et sécurité', 'Documents et photos'];
export function BusinessRequestScreen(props: ClientScreenProps<'BusinessRequest'>) {
  const state = useBusinessRequest(props);
  const { form, step } = state;
  const frequency = form.watch('frequency');
  const establishment = form.watch('establishmentType');
  if (!state.ready || !isBusinessCategory(state.category)) return null;
  const profile = businessProfiles[state.category];
  return <AuthLayout showFormLogo key={step} title={titles[step] ?? ''} subtitle={`${categoryTitle(state.category)} · ${step + 1} sur 6 — informations du site`}
    onBack={state.back} progress={<RequestProgress activeStep={2} professional />}>
    {step === 0 && <Controller control={form.control} name="establishmentType" render={({ field, fieldState }) => <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup" accessibilityLabel="Type d’établissement">
      <AppText variant="heading">{profile.question}</AppText>
      {profile.establishments.map(title => <SelectionCard key={title} title={title} icon="business-outline" selected={field.value === title} onPress={() => field.onChange(title)} />)}
      <MessageBanner message={fieldState.error?.message} />
    </View>} />}
    {step === 1 && <>
      <ControlledField control={form.control} name="companyName" label={profile.nameLabel} maxLength={150} />
      <ControlledField control={form.control} name="areaSqft" label="Superficie approximative (pi²)" keyboardType="decimal-pad" placeholder="Ex. : 15000" maxLength={10} />
      <Controller control={form.control} name="floors" render={({ field }) => <NumberStepper label="Nombre d’étages" min={1} max={100} value={field.value} onChange={field.onChange} />} />
      <ControlledField control={form.control} name="siteAddress" label="Adresse complète du site" placeholder="Rue, ville, province et code postal" multiline maxLength={300} />
    </>}
    {step === 2 && <Controller control={form.control} name="zones" render={({ field, fieldState }) => <>
      <AppText variant="heading">Quelles zones doivent être nettoyées ?</AppText>
      {profile.zones.map(zone => <ToggleRow key={zone} label={zone} value={field.value.includes(zone)} onChange={selected => field.onChange(selected ? [...field.value, zone] : field.value.filter(value => value !== zone))} />)}
      <AppText variant="caption">Précisez les autres espaces dans la description du service.</AppText>
      <MessageBanner message={fieldState.error?.message} />
    </>} />}
    {step === 3 && <>
      <ControlledField control={form.control} name="description" label="Service demandé" multiline maxLength={1000} style={{ minHeight: 120 }} placeholder={profile.serviceHint} />
      <Controller control={form.control} name="frequency" render={({ field, fieldState }) => <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup" accessibilityLabel="Fréquence">
        <AppText variant="label">Fréquence</AppText>
        {frequencies.map(title => <SelectionCard key={title} title={title} selected={field.value === title} onPress={() => field.onChange(title)} />)}
        <MessageBanner message={fieldState.error?.message} />
      </View>} />
      {frequency === 'Personnalisé' && <ControlledField control={form.control} name="customFrequency" label="Précisez la fréquence" maxLength={300} />}
      <ControlledField control={form.control} name="preferredHours" label="Horaires préférés (facultatif)" placeholder={profile.hoursHint} maxLength={300} />
    </>}
    {step === 4 && <>
      <AppText>Indiquez les exigences applicables à votre établissement. Ces informations seront analysées avant l’offre.</AppText>
      <ControlledField control={form.control} name="equipment" label="Équipements de protection requis (facultatif)" multiline maxLength={500} />
      <ControlledField control={form.control} name="restrictedAreas" label="Zones restreintes et accès (facultatif)" multiline maxLength={500} />
      <ControlledField control={form.control} name="allowedProducts" label="Produits autorisés (facultatif)" multiline maxLength={500} />
      <ControlledField control={form.control} name="constraints" label={profile.constraintsLabel} placeholder={profile.constraintsHint} multiline maxLength={1000} />
    </>}
    {step === 5 && <>
      <AppText>{profile.attachmentsHint} Les pièces jointes sont facultatives.</AppText>
      <RequestPhotoPicker /><RequestDocumentPicker />
    </>}
    <Button title="Continuer" disabled={step === 0 && !establishment} onPress={() => void state.continueRequest()} />
  </AuthLayout>;
}
