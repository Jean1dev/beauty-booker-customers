import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { OAuthProvider, signInWithCredential as jsSignInWithCredential } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { showAlert } from '@/platform/alert';
import { auth as jsAuth } from '@/services/firebase';

export function useAppleSignIn() {
  const [loading, setLoading] = useState(false);
  // On iOS with usesAppleSignIn: true configured in app.config.js, the entitlement
  // is always present and Apple Sign-In is supported on every iOS 13+ device that
  // can install this app (minimum iOS via Expo SDK 54). isAvailableAsync() exists
  // for codebases that share with non-iOS platforms; calling it here just to flip
  // the flag back to false on any throw was hiding the button in production
  // TestFlight builds — that catch path was the actual cause of the invisible button.
  const [isAvailable, setIsAvailable] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (available === false) setIsAvailable(false);
      })
      .catch((err) => {
        console.warn('[apple-auth] isAvailableAsync threw; keeping optimistic default', err);
      });
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const nonce = Math.random().toString(36).substring(2, 18);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { identityToken } = appleCredential;
      if (!identityToken) {
        showAlert('Erro', 'Apple não devolveu o token de identidade.');
        return;
      }

      const provider = new OAuthProvider('apple.com');
      const jsCredential = provider.credential({ idToken: identityToken, rawNonce: nonce });
      await jsSignInWithCredential(jsAuth, jsCredential);
    } catch (error: unknown) {
      const code =
        error != null && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED') return;
      showAlert('Erro', `Não foi possível entrar com Apple.\n\n${String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return { signIn, loading, isAvailable };
}
