import { useSupportTickets, replyToTicket } from '../../../services/api/support';
import { MessageBanner } from '../../../components/MessageBanner';
import { useState } from 'react';
import { useSupportStore, type SupportTicket } from '../../../store/supportStore';
import { AdminPage, AdminCard, AdminField } from '../components/AdminUI';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import type { AdminScreenProps } from '../types/admin';
function Ticket({ ticket, refresh }: { ticket: SupportTicket; refresh: () => void }) {
 const [error, setError] = useState<string>(); const [busy, setBusy] = useState(false);
 async function send() { if (busy) return; setBusy(true); try { await replyToTicket(ticket.id, reply); refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Envoi impossible'); } finally { setBusy(false); } }
 const [reply, setReply] = useState(ticket.reply ?? '');
 return <AdminCard><AppText variant="heading">{ticket.subject}</AppText><AppText>{ticket.author} · {new Date(ticket.createdAt).toLocaleString('fr-CA')}</AppText><AppText>{ticket.reference ?? ticket.id}</AppText><AppText>{ticket.message}</AppText><AdminField label="Réponse" value={reply} onChangeText={setReply} multiline maxLength={2000} /><Button title="Enregistrer la réponse" loading={busy} disabled={busy || reply.trim().length < 2} onPress={() => void send()} /><MessageBanner message={error} />{ticket.reply && <AppText>Réponse disponible dans l’espace de l’auteur après actualisation.</AppText>}</AdminCard>;
}
export function AdminSupportScreen({ onBack }: AdminScreenProps) {
 const { tickets, error, loading, refresh } = useSupportTickets();
 return <AdminPage title="Messages et support" onBack={onBack}><MessageBanner message={error?.message} />{loading && <AppText>Chargement…</AppText>}{tickets.length ? tickets.map(t => <Ticket key={t.id} ticket={t} refresh={() => void refresh()} />) : <AppText>Aucun message reçu.</AppText>}</AdminPage>;
}
