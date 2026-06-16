// lib/drive.ts — read-only Google Drive browsing (folders + video lessons) + a small cached hook.
import { useCallback, useEffect, useState } from 'react';
import { getAccessToken } from './auth';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

export type DriveItem = {
  id: string;
  name: string; // cleaned for display
  isFolder: boolean;
  size?: number; // bytes (lessons only)
};

export type FolderContents = {
  folders: DriveItem[];
  videos: DriveItem[];
};

// Strip a leading "Copy of " and (for videos) the file extension, for nicer display.
function cleanName(name: string, isFolder: boolean): string {
  let n = name.replace(/^Copy of /i, '');
  if (!isFolder) n = n.replace(/\.[^./]+$/, '');
  return n.trim();
}

// Natural order so "2. Foo" sorts before "10. Foo" (plain alphabetical would scramble them).
function byNaturalOrder(a: DriveItem, b: DriveItem): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}

// Accept a Drive folder link or a raw ID; return the folder ID (or null if unparseable).
export function extractFolderId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m =
    s.match(/\/folders\/([a-zA-Z0-9_-]+)/) ||
    s.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    s.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return /^[a-zA-Z0-9_-]+$/.test(s) ? s : null;
}

type DriveFile = { id: string; name: string; mimeType: string; size?: string };

// One authenticated Drive API GET (fresh Bearer token each call). Throws a friendly error on non-2xx.
async function driveFetch(path: string, errorLabel?: string): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(errorLabel ? `${errorLabel} (Drive ${res.status})` : `Drive ${res.status}`);
  }
  return res;
}

// List every child of a folder (paginated), split into folders + video lessons (others ignored).
export async function listFolder(folderId: string): Promise<FolderContents> {
  const collected: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size)',
      orderBy: 'name',
      pageSize: '1000',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await driveFetch(`files?${params}`, "Couldn't load this folder");
    const json = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
    if (json.files) collected.push(...json.files);
    pageToken = json.nextPageToken;
  } while (pageToken);

  const folders: DriveItem[] = [];
  const videos: DriveItem[] = [];
  for (const f of collected) {
    if (f.mimeType === FOLDER_MIME) {
      folders.push({ id: f.id, name: cleanName(f.name, true), isFolder: true });
    } else if (f.mimeType.startsWith('video/')) {
      videos.push({
        id: f.id,
        name: cleanName(f.name, false),
        isFolder: false,
        size: f.size ? Number(f.size) : undefined,
      });
    }
  }
  folders.sort(byNaturalOrder);
  videos.sort(byNaturalOrder);
  return { folders, videos };
}

// Folder title (for a screen header), e.g. the course / section name.
export async function getFolderName(folderId: string): Promise<string> {
  const res = await driveFetch(`files/${folderId}?fields=name`);
  const json = (await res.json()) as { name?: string };
  return json.name ?? 'Folder';
}

// ── Cached hook ──────────────────────────────────────────────────────────────
// In-memory cache → back-navigation is instant; pull-to-refresh forces a refetch.
const cache = new Map<string, FolderContents>();

export function useDriveFolder(folderId: string | null) {
  const [data, setData] = useState<FolderContents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folderId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    const cached = cache.get(folderId);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setData(null);
    setLoading(true);
    setError(null);
    listFolder(folderId)
      .then((result) => {
        cache.set(folderId, result);
        if (active) setData(result);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load folder');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [folderId]);

  const refresh = useCallback(async () => {
    if (!folderId) return;
    setError(null);
    try {
      const result = await listFolder(folderId);
      cache.set(folderId, result);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load folder');
    }
  }, [folderId]);

  return { data, loading, error, refresh };
}
