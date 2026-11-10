import { create } from 'zustand';
import type { User } from '../types/identity';
export interface SupportTicket { id: string; ownerId: string; author: string; role: User['role']; subject: string; message: string; reference?: string; reply?: string; createdAt: string }
interface State { tickets: SupportTicket[]; add: (user: User, subject: string, message: string, reference?: string) => string; reply: (id: string, message: string) => void }
export const useSupportStore = create<State>((set) => ({
 tickets: [], add(user, subject, message, reference) { const id = 'SUP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); set(s => ({ tickets: [{ id, ownerId: user.id, author: user.firstName + ' ' + user.lastName, role: user.role, subject, message, reference, createdAt: new Date().toISOString() }, ...s.tickets] })); return id; },
 reply(id, reply) { set(s => ({ tickets: s.tickets.map(t => t.id === id ? { ...t, reply: reply.trim() } : t) })); },
}));
