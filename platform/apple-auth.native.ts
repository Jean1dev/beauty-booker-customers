import auth from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { OAuthProvider, signInWithCredential as jsSignInWithCredential } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

import { showAlert } from '@/platform/alert';
import { auth as jsAuth } from '@/services/firebase';

export function useAppleSignIn() {
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable).catch(() => setIsAvailable(false));
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

      // RNFB sign-in (drives onAuthStateChanged → auth store → navigation)
      const rnfbCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
      await auth().signInWithCredential(rnfbCredential);

      // JS SDK sign-in (needed for Firestore/Storage access)
      try {
        const provider = new OAuthProvider('apple.com');
        const jsCredential = provider.credential({ idToken: identityToken, rawNonce: nonce });
        await jsSignInWithCredential(jsAuth, jsCredential);
      } catch (jsAuthError) {
        console.warn('[apple-auth] JS SDK sign-in failed, rolling back RNFB session', jsAuthError);
        try { await auth().signOut(); } catch {}
        throw jsAuthError;
      }
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
