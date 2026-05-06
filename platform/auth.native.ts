import {
  GoogleAuthProvider as JSGoogleAuthProvider,
  OAuthProvider,
  User as JSUser,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut as jsSignOut,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
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

async function reauthWithApple(currentUser: JSUser): Promise<void> {
  const nonce = Math.random().toString(36).substring(2, 18);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce,
  );
  const appleResult = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  const { identityToken } = appleResult;
  if (!identityToken) throw new Error('Apple não devolveu o token de identidade.');
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
  await reauthenticateWithCredential(currentUser, credential);
}

async function reauthWithGoogle(currentUser: JSUser): Promise<void> {
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
  await reauthenticateWithCredential(currentUser, credential);
}

export async function deleteAccount(): Promise<void> {
  const currentUser = jsAuth.currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado.');

  const isAppleUser = currentUser.providerData.some((p) => p.providerId === 'apple.com');

  if (isAppleUser) {
    await reauthWithApple(currentUser);
  } else {
    await reauthWithGoogle(currentUser);
  }

  await deleteUser(currentUser);
}
