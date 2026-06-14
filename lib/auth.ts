// lib/auth.ts — Google Sign-In + Drive access token (Phase 2). Replaces the dev token store.
import { useSyncExternalStore } from 'react';
import { GoogleSignin, type User } from '@react-native-google-signin/google-signin';

// Public Web OAuth client ID (not a secret — shipped in the app). The Android client is matched
// natively by package name + SHA-1, so only the web id is referenced here.
const WEB_CLIENT_ID = '800778524271-98b35kgp1poahq353ng3tadtno3vnp08.apps.googleusercontent.com';
const DRIVE_READONLY = 'https://www.googleapis.com/auth/drive.readonly';

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, scopes: [DRIVE_READONLY] });

type AuthState = { user: User | null; ready: boolean };
let state: AuthState = { user: null, ready: false };
const listeners = new Set<() => void>();

function emit(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const snapshot = () => state;

/** Restore a prior session silently. Call once at app start. */
export async function restoreSession(): Promise<void> {
  try {
    const res = await GoogleSignin.signInSilently();
    emit({ user: res.type === 'success' ? res.data : null, ready: true });
  } catch {
    emit({ user: null, ready: true });
  }
}

/** Interactive sign-in. Returns the user, or null if cancelled. */
export async function signIn(): Promise<User | null> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  if (res.type === 'success') emit({ user: res.data });
  return state.user;
}

export async function signOut(): Promise<void> {
  await GoogleSignin.signOut();
  emit({ user: null });
}

/** Fresh Drive access token — silently refreshed on Android. Call right before a request. */
export async function getAccessToken(): Promise<string> {
  const { accessToken } = await GoogleSignin.getTokens();
  return accessToken;
}

/** Reactive auth state — components re-render on sign-in/out. */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
