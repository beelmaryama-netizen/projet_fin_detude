import { create } from 'zustand';
export const useLocalStatus = create<{ ready: boolean; error?: string; lastSaved?: string; offline: boolean }>(() => ({ ready: false, offline: false }));
