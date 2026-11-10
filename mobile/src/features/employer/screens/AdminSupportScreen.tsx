import { useState } from 'react';
import { useSupportStore, type SupportTicket } from '../../../store/supportStore';
import { AdminPage, AdminCard, AdminField } from '../components/AdminUI';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import type { AdminScreenProps } from '../types/admin';
function Ticket({ ticket }: { ticket: SupportTicket }) {
 const [reply, setReply] = useState(ticket.reply ?? '');
 return <AdminCard><AppText variant="heading">{ticket.subject}</AppText><AppText>{ticket.author} · {new Date(ticket.createdAt).toLocaleString('fr-CA')}</AppText><AppText>{ticket.reference ?? ticket.id}</AppText><AppText>{ticket.message}</AppText><AdminField label="Réponse" value={reply} onChangeText={setReply} multiline maxLength={2000} /><Button title="Enregistrer la réponse" disabled={reply.trim().length < 2} onPress={() => useSupportStore.getState().reply(ticket.id, reply)} />{ticket.reply && <AppText>Réponse disponible dans l’espace de l’auteur sur cet appareil.</AppText>}</AdminCard>;
}
export function AdminSupportScreen({ onBack }: AdminScreenProps) {
 const tickets = useSupportStore(s => s.tickets);
 return <AdminPage title="Messages et support" onBack={onBack}>{tickets.length ? tickets.map(t => <Ticket key={t.id} ticket={t} />) : <AppText>Aucun message reçu.</AppText>}</AdminPage>;
}
