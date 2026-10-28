import { View } from 'react-native';
import { Controller } from 'react-hook-form';
import { ClientLayout } from '../components/ClientLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { ControlledField } from '../../../components/ControlledField';
import { ToggleRow } from '../../../components/ToggleRow';
import { SelectionCard } from '../../../components/SelectionCard';
import { MessageBanner } from '../../../components/MessageBanner';
import { AsyncState, EmptyState } from '../../../components/AsyncState';
import { useClientQuery, errorMessage } from '../hooks/useClientData';
import { useAddressForm } from '../hooks/useAddressForm';
import { addressService } from '../services/clientServices';
import { spacing } from '../../../theme/tokens';
import type { ClientAddress } from '../types/client';
import type { ClientScreenProps } from '../../../navigation/types';
function AddressForm({ address, done }: { address?: ClientAddress; done: () => void }) {
  const state = useAddressForm(address, done);
  return <><AppText variant="label">Libellé</AppText><Controller control={state.form.control} name="label" render={({ field }) => <View accessibilityRole="radiogroup" accessibilityLabel="Libellé de l’adresse" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{(['Maison', 'Travail', 'Autre'] as const).map(value => <SelectionCard compact key={value} title={value} selected={field.value === value} onPress={() => field.onChange(value)} />)}</View>} />
    <ControlledField control={state.form.control} name="street" label="Adresse" autoComplete="street-address" maxLength={180} />
    <ControlledField control={state.form.control} name="unit" label="Appartement / unité (facultatif)" maxLength={30} />
    <ControlledField control={state.form.control} name="city" label="Ville" maxLength={80} />
    <ControlledField control={state.form.control} name="province" label="Province" placeholder="QC" autoCapitalize="characters" maxLength={2} />
    <ControlledField control={state.form.control} name="postalCode" label="Code postal" placeholder="H2X 1Y4" autoComplete="postal-code" autoCapitalize="characters" maxLength={7} />
    <ControlledField control={state.form.control} name="accessNotes" label="Instructions d’accès" multiline maxLength={500} />
    <Controller control={state.form.control} name="isDefault" render={({ field }) => <ToggleRow label="Adresse par défaut" value={field.value} onChange={field.onChange} disabled={address?.isDefault} />} />
    {address?.isDefault && <AppText variant="caption">Pour changer l’adresse par défaut, sélectionnez une autre adresse dans la liste.</AppText>}
    <MessageBanner message={state.save.error ? errorMessage(state.save.error) : undefined} /><Button title="Enregistrer l’adresse" loading={state.save.isPending} onPress={() => void state.submit()} />
  </>;
}
export function AddressFormScreen({ navigation, route }: ClientScreenProps<'AddressForm'>) {
  const query = useClientQuery('addresses', addressService.list); const id = route.params?.id; const address = query.data?.find(item => item.id === id);
  return <ClientLayout title={id ? 'Modifier l’adresse' : 'Ajouter une adresse'} subtitle="Renseignez le lieu du service." onBack={() => navigation.goBack()}>
    <AsyncState query={query}>{id && !address ? <EmptyState title="Adresse indisponible" description="Cette adresse a peut-être été supprimée." /> : <AddressForm address={address} done={() => navigation.goBack()} />}</AsyncState>
  </ClientLayout>;
}
