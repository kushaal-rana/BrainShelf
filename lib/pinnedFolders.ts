// lib/pinnedFolders.ts — folders the user has pinned for quick access, persisted across launches.
import { createPersistedStore } from './createPersistedStore';

export type PinnedFolder = { id: string; name: string };

const store = createPersistedStore<PinnedFolder[]>('brainshelf.pinnedFolders', []);

/** Pin a folder, or unpin it if it is already pinned. */
export function togglePin(folder: PinnedFolder): void {
  const current = store.get();
  const alreadyPinned = current.some((p) => p.id === folder.id);
  store.set(alreadyPinned ? current.filter((p) => p.id !== folder.id) : [...current, folder]);
}

type PinnedState = { pinned: PinnedFolder[]; ready: boolean };

/** Reactive list of pinned folders. */
export function usePinnedFolders(): PinnedState {
  const { value, ready } = store.use();
  return { pinned: value, ready };
}
