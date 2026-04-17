import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signOut as jsSignOut } from 'firebase/auth';

import { auth as jsAuth } from '@/services/firebase';

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
    Promise.resolve(listener(toAuthUser(user))).catch((error) => {
      console.warn('[auth] subscribeAuth listener threw', error);
    });
  });
}

export async function signOut(): Promise<void> {
  const results = await Promise.allSettled([
    auth().signOut(),
    jsSignOut(jsAuth),
    GoogleSignin.signOut(),
  ]);

  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn('[auth] signOut step failed', result.reason);
    }
  }
}
