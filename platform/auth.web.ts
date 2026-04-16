import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';

import { auth } from '@/services/firebase';

import type { AuthListener, AuthUser } from './auth';

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function subscribeAuth(listener: AuthListener): () => void {
  return onAuthStateChanged(auth, (user) => {
    Promise.resolve(listener(toAuthUser(user))).catch(() => {});
  });
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
