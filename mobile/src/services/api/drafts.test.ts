import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./config', () => ({ apiBaseURL: 'http://test/api' }));
const disk = vi.hoisted(() => new Map<string, string>());
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, AppState: { addEventListener: vi.fn() } }));
vi.mock('expo-file-system/legacy', () => ({
 documentDirectory: 'file:///documents/',
 getInfoAsync: async (path: string) => ({ exists: disk.has(path) }),
 readAsStringAsync: async (path: string) => disk.get(path),
 writeAsStringAsync: async (path: string, value: string) => { disk.set(path, value); },
 copyAsync: async ({ from, to }: { from: string; to: string }) => { disk.set(to, disk.get(from)!); },
 deleteAsync: async (path: string) => { disk.delete(path); },
 moveAsync: async ({ from, to }: { from: string; to: string }) => { disk.set(to, disk.get(from)!); disk.delete(from); },
}));
afterEach(() => vi.useRealTimers());
it('restores API drafts across accounts and app restarts without storing sessions', async () => {
 vi.useFakeTimers();
 const first = await import('./drafts');
 await first.initializeApiDrafts();
 const { useRequestDraftStore: draft } = await import('../../store/requestDraftStore');
 draft.getState().bindOwner('client-a');
 draft.getState().updateResidential({ description: 'Cuisine A' });
 draft.getState().bindOwner('client-b');
 expect(draft.getState().residential.description).toBe('');
 draft.getState().updateResidential({ description: 'Cuisine B' });
 draft.getState().bindOwner('client-a');
 expect(draft.getState().residential.description).toBe('Cuisine A');
 await first.saveApiDrafts();
 expect([...disk.values()].join('')).not.toContain('accessToken');
 vi.clearAllTimers(); vi.resetModules();
 const second = await import('./drafts'); await second.initializeApiDrafts();
 const { useRequestDraftStore: restored } = await import('../../store/requestDraftStore');
 restored.getState().bindOwner('client-b');
 expect(restored.getState().residential.description).toBe('Cuisine B');
 restored.getState().bindOwner('client-a');
 expect(restored.getState().residential.description).toBe('Cuisine A');
 vi.clearAllTimers();
});
