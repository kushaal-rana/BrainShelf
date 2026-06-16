// lib/rootFolder.ts — the user's root Drive folder (their course shelf), persisted across launches.
import { createPersistedStore } from './createPersistedStore';

// Stored as the raw id (matching the pre-refactor format, so an existing saved folder survives).
const store = createPersistedStore<string | null>('brainshelf.rootFolderId', null, {
  serialize: (id) => id ?? '',
  deserialize: (raw) => raw || null,
});

type RootState = { rootId: string | null; ready: boolean };

/** Save (and persist) the root course folder. */
export async function setRootFolder(id: string): Promise<void> {
  store.set(id);
}

/** Reactive root folder. `ready` flips true once AsyncStorage has been read. */
export function useRootFolder(): RootState {
  const { value, ready } = store.use();
  return { rootId: value, ready };
}
