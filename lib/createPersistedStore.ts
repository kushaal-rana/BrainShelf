// lib/createPersistedStore.ts — a reactive store whose value is persisted to AsyncStorage:
// lazily loaded on first use, written back on every set. Built on createStore.
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from './createStore';

type Codec<T> = {
  serialize: (value: T) => string;
  deserialize: (raw: string) => T;
};

export type PersistedStore<T> = {
  get: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
  use: () => { value: T; ready: boolean };
};

export function createPersistedStore<T>(key: string, initial: T, codec?: Codec<T>): PersistedStore<T> {
  const serialize = codec?.serialize ?? ((v: T) => JSON.stringify(v));
  const deserialize = codec?.deserialize ?? ((raw: string) => JSON.parse(raw) as T);

  const store = createStore<{ value: T; ready: boolean }>({ value: initial, ready: false });
  let started = false;

  async function load() {
    try {
      const raw = await AsyncStorage.getItem(key);
      store.set({ value: raw != null ? deserialize(raw) : initial, ready: true });
    } catch {
      store.set({ ready: true });
    }
  }

  // Kick the one-time load the first time anything subscribes (mirrors the old lazy-load).
  const subscribe = (listener: () => void) => {
    if (!started) {
      started = true;
      void load();
    }
    return store.subscribe(listener);
  };

  const get = () => store.get().value;
  const set = (value: T) => {
    store.set({ value });
    AsyncStorage.setItem(key, serialize(value)).catch(() => {
      // kept in memory for the session even if the disk write fails
    });
  };
  const use = () => useSyncExternalStore(subscribe, store.get, store.get);

  return { get, set, subscribe, use };
}
