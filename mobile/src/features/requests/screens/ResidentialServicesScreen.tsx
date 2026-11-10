import { RequestProgress } from '../components/RequestProgress';
import { useState } from 'react';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { ToggleRow } from '../../../components/ToggleRow';
import { FormField } from '../../../components/FormField';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import type { ClientScreenProps } from '../../../navigation/types';
export const residentialServices = ['Entretien régulier', 'Grand ménage', 'Cuisine', 'Salles de bain', 'Planchers', 'Fenêtres intérieures', 'Sous-sol', 'Autre demande'] as const;
export function ResidentialServicesScreen({ navigation }: ClientScreenProps<'ResidentialServices'>) {
 const details = useRequestDraftStore(s => s.residential); const update = useRequestDraftStore(s => s.updateResidential); const [error, setError] = useState('');
 return <AuthLayout showFormLogo progress={<RequestProgress activeStep={3} />} title="Services souhaités" subtitle="Choisissez les prestations à inclure dans votre demande." onBack={() => navigation.goBack()}>
 {residentialServices.map(label => <ToggleRow key={label} label={label} value={details.services?.includes(label) ?? false} onChange={selected => update({ services: selected ? [...(details.services ?? []), label] : details.services?.filter(s => s !== label) })} />)}
 <FormField label="Stationnement et accès au bâtiment" value={details.parking ?? ''} onChangeText={parking => update({ parking })} multiline maxLength={500} />
 {!!error && <AppText accessibilityRole="alert">{error}</AppText>}
 <Button title="Continuer" onPress={() => { if (!details.services?.length) { setError('Choisissez au moins un service.'); return; } navigation.navigate('ResidentialSchedulePreferences'); }} />
 </AuthLayout>;
}
