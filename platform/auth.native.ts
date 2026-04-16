import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import type { AuthListener, AuthUser } from './auth';

function toAuthUser(user: FirebaseAuthTypes.User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function subscribeAuth(listener: AuthListener): () => void {
  return auth().onAuthStateChanged((user) => {
    Promise.resolve(listener(toAuthUser(user))).catch(() => {});
  });
}

export async function signOut(): Promise<void> {
  await auth().signOut();
}
