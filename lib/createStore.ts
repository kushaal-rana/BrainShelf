// lib/createStore.ts — a tiny reactive store over useSyncExternalStore. The subscribe/emit
// boilerplate shared by auth / rootFolder / pinnedFolders lives here in exactly one place.
import { useSyncExternalStore } from 'react';

export type Store<T> = {
  get: () => T;
  set: (patch: Partial<T>) => void;
  subscribe: (listener: () => void) => () => void;
  use: () => T;
};

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  const get = () => state;
  const set = (patch: Partial<T>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const use = () => useSyncExternalStore(subscribe, get, get);

  return { get, set, subscribe, use };
}
