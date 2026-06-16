// lib/progress.ts — per-lesson playback progress (resume position + completion), persisted.
// One in-memory map (loaded once) keyed by Drive fileId → instant lookups for library rows.
import { useSyncExternalStore } from 'react';
import { createPersistedStore } from './createPersistedStore';

export type LessonProgress = {
  position: number; // last playback position, seconds
  duration: number; // total length, seconds (0 until known)
  completed: boolean;
  updatedAt: number; // epoch ms
};

const COMPLETE_RATIO = 0.9; // auto-complete once 90% watched

const store = createPersistedStore<Record<string, LessonProgress>>('brainshelf.progress', {});

/** Current progress for a lesson (non-reactive — for the player to read once on load). */
export function getProgress(fileId: string): LessonProgress | undefined {
  return store.get()[fileId];
}

/** Merge a playback position for a lesson; auto-completes past COMPLETE_RATIO. Call throttled. */
export function saveProgress(fileId: string, position: number, duration: number): void {
  const all = store.get();
  const prev = all[fileId];
  const completed =
    (prev?.completed ?? false) || (duration > 0 && position / duration >= COMPLETE_RATIO);
  store.set({ ...all, [fileId]: { position, duration, completed, updatedAt: Date.now() } });
}

/** Manually flip a lesson's completed flag (keeps its saved position). */
export function toggleComplete(fileId: string): void {
  const all = store.get();
  const prev = all[fileId];
  store.set({
    ...all,
    [fileId]: {
      position: prev?.position ?? 0,
      duration: prev?.duration ?? 0,
      completed: !(prev?.completed ?? false),
      updatedAt: Date.now(),
    },
  });
}

/** Reactive progress for ONE lesson — only this lesson's row re-renders when it changes. */
export function useLessonProgress(fileId: string): LessonProgress | undefined {
  const getSnapshot = () => store.get()[fileId];
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
