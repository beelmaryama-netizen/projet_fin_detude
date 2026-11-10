import { create } from 'zustand';
import type { MissionStatus } from '../features/employer/types/admin';
export interface MissionFilters { status: MissionStatus | 'all'; query: string; employeeId: string; service: string; date: string; expanded: boolean; period: { from?: string; to?: string } }
export const useAdminFilterStore = create<{ byOwner: Record<string, MissionFilters>; save: (owner: string, value: MissionFilters) => void }>(set => ({ byOwner: {}, save: (owner, value) => set(s => ({ byOwner: { ...s.byOwner, [owner]: value } })) }));
