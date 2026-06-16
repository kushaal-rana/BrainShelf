// lib/format.ts — small shared formatters.

/** Human-readable byte size, e.g. 142 MB / 2.1 GB. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${Math.round(bytes / 1e6)} MB`;
  if (bytes > 0) return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
  return '—';
}
