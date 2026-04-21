import auth, { FirebaseAuthTypes, GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

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
  const credential = GoogleAuthProvider.credential(idToken);
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado.');
  await currentUser.reauthenticateWithCredential(credential);
  await currentUser.delete();
}
