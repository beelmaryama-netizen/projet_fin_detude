import { beforeEach, afterEach, expect, it, vi } from 'vitest';
vi.mock('./api/config', () => ({ apiMode: false, apiBaseURL: '' }));
vi.mock('../features/auth/services/apiAuthService', () => ({ apiAuthService: {}, restoreApiSession: vi.fn() }));
vi.mock('./tokenStorage', () => ({ tokenStorage: { read: async () => null, write: async () => undefined, clear: async () => undefined } }));
const disk = vi.hoisted(() => ({ files: new Map<string, string>(), fail: false }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, AppState: { addEventListener: vi.fn(() => ({ remove: vi.fn() })) } }));
vi.mock('expo-file-system/legacy', () => ({
 documentDirectory: 'file:///documents/',
 getInfoAsync: async (path: string) => ({ exists: disk.files.has(path) }),
 readAsStringAsync: async (path: string) => disk.files.get(path),
 writeAsStringAsync: async (path: string, content: string) => { if (disk.fail) throw Error('disk full'); disk.files.set(path, content); },
 copyAsync: async ({ from, to }: { from: string; to: string }) => { disk.files.set(to, disk.files.get(from)!); },
 deleteAsync: async (path: string) => { disk.files.delete(path); },
 moveAsync: async ({ from, to }: { from: string; to: string }) => { disk.files.set(to, disk.files.get(from)!); disk.files.delete(from); },
}));
vi.mock('expo-crypto', () => ({
 randomUUID: () => globalThis.crypto.randomUUID(),
 CryptoDigestAlgorithm: { SHA256: 'SHA256' },
 digestStringAsync: async (_algorithm: string, value: string) => Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(byte => byte.toString(16).padStart(2, '0')).join(''),
}));
beforeEach(() => { vi.resetModules(); disk.files.clear(); disk.fail = false; });
afterEach(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
it('restores drafts after restart, partitions them by account and persists password fingerprints only', async () => {
 const workspace = await import('./localWorkspace');
 await Promise.all([workspace.initializeWorkspace(), workspace.initializeWorkspace()]);
 const { useRequestDraftStore: draft } = await import('../store/requestDraftStore');
 draft.getState().bindOwner('client-a'); draft.getState().updateResidential({ description: 'Brouillon conservé' });
 draft.getState().bindOwner('client-b'); expect(draft.getState().residential.description).toBe('');
 await workspace.saveWorkspace();
 const raw = disk.files.get('file:///documents/magicpro-workspace-v1.json')!;
 expect(raw).not.toContain('MagicPro!2026'); expect(raw).toContain('sha256$');
 await new Promise(resolve => setTimeout(resolve, 300));
 vi.resetModules();
 const resumed = await import('./localWorkspace'); await resumed.initializeWorkspace();
 const { useRequestDraftStore: restored } = await import('../store/requestDraftStore');
 restored.getState().bindOwner('client-a'); expect(restored.getState().residential.description).toBe('Brouillon conservé');
 restored.getState().bindOwner('client-b'); expect(restored.getState().residential.description).toBe('');
});
it('reports storage failure and allows saving again without losing in-memory changes', async () => {
 const workspace = await import('./localWorkspace'); await workspace.initializeWorkspace();
 const { useLocalStatus } = await import('../store/localStatusStore');
 disk.fail = true; await workspace.saveWorkspace(); expect(useLocalStatus.getState().error).toContain('sauvegarde');
 disk.fail = false; await workspace.saveWorkspace(); expect(useLocalStatus.getState().error).toBeUndefined();
});
it('keeps an unreadable snapshot intact and permits retry after recovery', async () => {
 const path = 'file:///documents/magicpro-workspace-v1.json'; disk.files.set(path, '{broken');
 const workspace = await import('./localWorkspace'); await workspace.initializeWorkspace();
 const { useLocalStatus } = await import('../store/localStatusStore');
 expect(useLocalStatus.getState().ready).toBe(false); expect(disk.files.get(path)).toBe('{broken');
 disk.files.delete(path); await workspace.initializeWorkspace(); expect(useLocalStatus.getState().ready).toBe(true);
});
