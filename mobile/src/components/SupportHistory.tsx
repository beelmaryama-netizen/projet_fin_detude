import { useSupportTickets } from '../services/api/support';
import { MessageBanner } from './MessageBanner';
import { AppText } from './AppText';
import { Card } from './Card';
import { useSupportStore } from '../store/supportStore';
import { useAuthStore } from '../store/authStore';
export function SupportHistory() {
 const userId = useAuthStore(s => s.session?.user.id); const { tickets, error, loading } = useSupportTickets();
 return <><MessageBanner message={error?.message} />{loading && <AppText>Chargement des messages…</AppText>}{tickets.filter(t => t.ownerId === userId).map(t => <Card key={t.id}><AppText variant="heading">{t.subject}</AppText><AppText>{t.message}</AppText><AppText>{t.reference ? 'Dossier : ' + t.reference : t.id}</AppText><AppText>{t.reply ? 'Réponse : ' + t.reply : 'En attente de réponse de l’administration'}</AppText></Card>)}</>;
}
