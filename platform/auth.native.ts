import {
  GoogleAuthProvider as JSGoogleAuthProvider,
  User as JSUser,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut as jsSignOut,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

import { auth as jsAuth } from '@/services/firebase';
import type { AuthListener, AuthUser } from './auth';

function toAuthUser(user: JSUser | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function subscribeAuth(listener: AuthListener): () => void {
  return onAuthStateChanged(jsAuth, (user) => {
    Promise.resolve(listener(toAuthUser(user))).catch((error) => {
      console.warn('[auth] subscribeAuth listener threw', error);
    });
  });
}

export async function signOut(): Promise<void> {
  const results = await Promise.allSettled([
    jsSignOut(jsAuth),
    GoogleSignin.signOut(),
  ]);

  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn('[auth] signOut step failed', result.reason);
    }
  }
}

export async function deleteAccount(): Promise<void> {
  const webClientId =
    (Constants.expoConfig?.extra as { googleWebClientId?: string } | undefined)
      ?.googleWebClientId ?? '';
  GoogleSignin.configure({ webClientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  const idToken =
    (result as { data?: { idToken?: string | null } }).data?.idToken ??
    (result as { idToken?: string | null }).idToken ??
    null;
  if (!idToken) throw new Error('Google não devolveu o token de identidade.');
  const credential = JSGoogleAuthProvider.credential(idToken);
  const currentUser = jsAuth.currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado.');
  await reauthenticateWithCredential(currentUser, credential);
  await deleteUser(currentUser);
}
