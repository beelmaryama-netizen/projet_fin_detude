import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientLayout } from '../components/ClientLayout';
import { ControlledField } from '../../../components/ControlledField';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { useClientMutation, errorMessage } from '../hooks/useClientData';
import { supportService } from '../services/clientServices';
import { supportSchema } from '../schemas/clientSchemas';
import type { SupportInput } from '../types/client';
import type { ClientScreenProps } from '../../../navigation/types';
export function ContactSupportScreen({ navigation }: ClientScreenProps<'ContactSupport'>) {
  const form = useForm<SupportInput>({ resolver: zodResolver(supportSchema), defaultValues: { subject: '', message: '' }, mode: 'onTouched' });
  const send = useClientMutation(supportService.send, () => form.reset());
  return <ClientLayout title="Contacter MagicPro" subtitle="Décrivez votre question. Dans cette version, l’envoi est simulé." onBack={() => navigation.goBack()}>
    <ControlledField control={form.control} name="subject" label="Sujet" maxLength={100} /><ControlledField control={form.control} name="message" label="Message" multiline maxLength={2000} style={{ minHeight: 160 }} />
    <MessageBanner message={send.error ? errorMessage(send.error) : undefined} />{send.isSuccess && <MessageBanner tone="success" message={`Message enregistré en démonstration · ${send.data.reference}. Aucun email réel n’a été envoyé.`} />}
    <Button title="Envoyer le message" loading={send.isPending} onPress={() => void form.handleSubmit(value => send.mutate(value))()} />
  </ClientLayout>;
}
