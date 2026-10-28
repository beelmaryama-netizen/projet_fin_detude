import { useState } from 'react';
import { ClientLayout } from '../components/ClientLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { StatusChip } from '../../../components/StatusChip';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { MessageBanner } from '../../../components/MessageBanner';
import { AsyncState, EmptyState } from '../../../components/AsyncState';
import { useClientQuery, useClientMutation, errorMessage } from '../hooks/useClientData';
import { addressService } from '../services/clientServices';
import { addressLabel } from '../services/clientFormatters';
import type { ClientScreenProps } from '../../../navigation/types';
export function MyAddressesScreen({ navigation }: ClientScreenProps<'MyAddresses'>) {
  const query = useClientQuery('addresses', addressService.list); const [deleting, setDeleting] = useState<string>();
  const remove = useClientMutation(addressService.remove, () => setDeleting(undefined)); const setDefault = useClientMutation(addressService.setDefault);
  return <ClientLayout title="Mes adresses" subtitle="Vos lieux de service enregistrés." onBack={() => navigation.goBack()} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <Button title="Ajouter une adresse" icon="add" onPress={() => navigation.navigate('AddressForm')} />
    <MessageBanner message={setDefault.error ? errorMessage(setDefault.error) : undefined} />
    <AsyncState query={query}>{query.data?.length ? query.data.map(address => <Card key={address.id}><AppText variant="heading">{address.label}</AppText>{address.isDefault && <StatusChip label="Adresse par défaut" tone="success" />}<AppText>{addressLabel(address)}</AppText>{!!address.accessNotes && <AppText>{address.accessNotes}</AppText>}
      <Button title="Modifier" variant="secondary" onPress={() => navigation.navigate('AddressForm', { id: address.id })} />
      {!address.isDefault && <Button title="Définir par défaut" variant="secondary" loading={setDefault.isPending} onPress={() => setDefault.mutate(address.id)} />}
      <Button title="Supprimer" variant="link" onPress={() => { remove.reset(); setDeleting(address.id); }} />
    </Card>) : <EmptyState title="Aucune adresse" description="Ajoutez une adresse pour vos prochaines demandes." />}</AsyncState>
    <ConfirmModal visible={!!deleting} title="Supprimer cette adresse ?" message="Les adresses déjà associées à vos demandes et réservations seront conservées dans ces dossiers." confirmLabel="Supprimer l’adresse" busy={remove.isPending} error={remove.error ? errorMessage(remove.error) : undefined} onCancel={() => setDeleting(undefined)} onConfirm={() => { if (deleting && !remove.isPending) remove.mutate(deleting); }} />
  </ClientLayout>;
}
