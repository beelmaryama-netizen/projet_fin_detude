import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientLayout } from '../components/ClientLayout';
import { Button } from '../../../components/Button';
import { ToggleRow } from '../../../components/ToggleRow';
import { MessageBanner } from '../../../components/MessageBanner';
import { AsyncState } from '../../../components/AsyncState';
import { useClientQuery, useClientMutation, errorMessage } from '../hooks/useClientData';
import { notificationService } from '../services/clientServices';
import { preferencesSchema } from '../schemas/clientSchemas';
import type { NotificationPreferences } from '../types/client';
import type { ClientScreenProps } from '../../../navigation/types';
const options = [{ name: 'newQuotes', label: 'Nouvelles offres' }, { name: 'bookingConfirmations', label: 'Confirmations de réservation' }, { name: 'bookingChanges', label: 'Changements de réservation' }, { name: 'reminders', label: 'Rappels' }] as const;
function PreferencesForm({ initial }: { initial: NotificationPreferences }) {
  const form = useForm<NotificationPreferences>({ defaultValues: initial, resolver: zodResolver(preferencesSchema) });
  const save = useClientMutation(notificationService.savePreferences, value => form.reset(value));
  return <>{options.map(option => <Controller key={option.name} control={form.control} name={option.name} render={({ field }) => <ToggleRow label={option.label} value={field.value} onChange={field.onChange} disabled={save.isPending} />} />)}<MessageBanner message={save.error ? errorMessage(save.error) : undefined} />{save.isSuccess && !form.formState.isDirty && <MessageBanner tone="success" message="Préférences enregistrées." />}<Button title="Enregistrer les préférences" loading={save.isPending} onPress={() => void form.handleSubmit(value => save.mutate(value))()} /></>;
}
export function NotificationPreferencesScreen({ navigation }: ClientScreenProps<'NotificationPreferences'>) {
  const query = useClientQuery('preferences', notificationService.preferences);
  return <ClientLayout title="Préférences de notifications" subtitle="Choisissez les informations que vous souhaitez recevoir. Les notifications push seront raccordées ultérieurement." onBack={() => navigation.goBack()}><AsyncState query={query}>{query.data && <PreferencesForm initial={query.data} />}</AsyncState><Button title="Voir mes notifications" variant="secondary" onPress={() => navigation.navigate('Notifications')} /></ClientLayout>;
}
