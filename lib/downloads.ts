// lib/downloads.ts — offline lesson downloads: fetch Drive media to disk (with the Bearer header),
// track live progress in memory, and persist completed records so they survive restarts.
// Uses the SDK-54 legacy FileSystem API for its progress callback (the new File API has none).
import { useSyncExternalStore } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from './createStore';
import { getAccessToken } from './auth';

const KEY = 'brainshelf.downloads';
const DIR = (FileSystem.documentDirectory ?? '') + 'downloads/';
const streamUrl = (fileId: string) => `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

export type DownloadStatus = 'downloading' | 'done' | 'error';
export type DownloadEntry = {
  name: string;
  status: DownloadStatus;
  progress: number; // 0..1
  localUri?: string;
  size?: number; // bytes, when done
};

// In-memory reactive map of all downloads (live progress + completed).
const store = createStore<{ items: Record<string, DownloadEntry> }>({ items: {} });

type PersistedEntry = { name: string; localUri: string; size: number };

function setEntry(fileId: string, entry: DownloadEntry | null) {
  const items = { ...store.get().items };
  if (entry) items[fileId] = entry;
  else delete items[fileId];
  store.set({ items });
}

// Persist only completed downloads (not the transient progress ticks).
async function persistDone() {
  const done: Record<string, PersistedEntry> = {};
  for (const [id, e] of Object.entries(store.get().items)) {
    if (e.status === 'done' && e.localUri) {
      done[id] = { name: e.name, localUri: e.localUri, size: e.size ?? 0 };
    }
  }
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(done));
  } catch {
    // best-effort
  }
}

let started = false;
async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const done = JSON.parse(raw) as Record<string, PersistedEntry>;
    const items: Record<string, DownloadEntry> = {};
    for (const [id, d] of Object.entries(done)) {
      items[id] = { name: d.name, status: 'done', progress: 1, localUri: d.localUri, size: d.size };
    }
    store.set({ items });
  } catch {
    // ignore a corrupt store
  }
}

function subscribe(listener: () => void) {
  if (!started) {
    started = true;
    void hydrate();
  }
  return store.subscribe(listener);
}

/** Start downloading a lesson to disk (Bearer header) with live progress. No-op if already saved/in-flight. */
export async function startDownload(fileId: string, name: string): Promise<void> {
  const existing = store.get().items[fileId];
  if (existing && existing.status !== 'error') return;

  setEntry(fileId, { name, status: 'downloading', progress: 0 });
  try {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
    const token = await getAccessToken();
    const localUri = DIR + fileId + '.mp4';
    const task = FileSystem.createDownloadResumable(
      streamUrl(fileId),
      localUri,
      { headers: { Authorization: `Bearer ${token}` } },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        const cur = store.get().items[fileId];
        if (!cur) return;
        const progress = totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0;
        setEntry(fileId, { ...cur, progress });
      }
    );
    const result = await task.downloadAsync();
    if (!result) throw new Error('download cancelled');
    const info = await FileSystem.getInfoAsync(result.uri);
    setEntry(fileId, {
      name,
      status: 'done',
      progress: 1,
      localUri: result.uri,
      size: info.exists ? info.size : 0,
    });
    await persistDone();
  } catch {
    setEntry(fileId, { name, status: 'error', progress: 0 });
  }
}

/** Delete a downloaded lesson (file + record). */
export async function deleteDownload(fileId: string): Promise<void> {
  const entry = store.get().items[fileId];
  if (entry?.localUri) {
    await FileSystem.deleteAsync(entry.localUri, { idempotent: true }).catch(() => {});
  }
  setEntry(fileId, null);
  await persistDone();
}

/** Non-reactive lookup (the player reads once on load to pick local vs stream). */
export function getDownload(fileId: string): DownloadEntry | undefined {
  return store.get().items[fileId];
}

/** Reactive state for ONE lesson (selector — only that row re-renders on change). */
export function useDownload(fileId: string): DownloadEntry | undefined {
  const getSnapshot = () => store.get().items[fileId];
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Reactive full map for the Downloads tab. */
export function useDownloadsMap(): Record<string, DownloadEntry> {
  const getSnapshot = () => store.get().items;
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
