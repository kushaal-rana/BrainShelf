// lib/rootFolder.ts — the user's root Drive folder (their course shelf), persisted across launches.
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'brainshelf.rootFolderId';

type RootState = { rootId: string | null; ready: boolean };
let state: RootState = { rootId: null, ready: false };
const listeners = new Set<() => void>();
let started = false;

function emit(next: Partial<RootState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

async function load() {
  try {
    const id = await AsyncStorage.getItem(KEY);
    emit({ rootId: id, ready: true });
  } catch {
    emit({ rootId: null, ready: true });
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!started) {
    started = true;
    void load();
  }
  return () => {
    listeners.delete(l);
  };
}
const snapshot = () => state;

/** Save (and persist) the root course folder. */
export async function setRootFolder(id: string): Promise<void> {
  emit({ rootId: id });
  try {
    await AsyncStorage.setItem(KEY, id);
  } catch {
    // kept in memory for the session even if the disk write fails
  }
}

/** Reactive root folder. `ready` flips true once AsyncStorage has been read. */
export function useRootFolder(): RootState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
