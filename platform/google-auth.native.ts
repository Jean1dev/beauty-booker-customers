import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect } from 'react';

import { showAlert } from '@/platform/alert';
import { auth } from '@/services/firebase';

const extra = Constants.expoConfig?.extra as
  | {
      googleWebClientId?: string;
      googleIosClientId?: string;
      googleAndroidClientId?: string;
    }
  | undefined;

const webClientId = extra?.googleWebClientId ?? '';
const iosClientId = extra?.googleIosClientId ?? '';
const androidClientId = extra?.googleAndroidClientId ?? '';

export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
    iosClientId: iosClientId || webClientId,
    androidClientId: androidClientId || webClientId,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params.id_token;
    if (typeof idToken !== 'string' || idToken.length === 0) {
      showAlert('Erro', 'Resposta do Google sem token de identidade.');
      return;
    }
    const credential = GoogleAuthProvider.credential(idToken);
    let cancelled = false;
    (async () => {
      try {
        await signInWithCredential(auth, credential);
      } catch {
        if (!cancelled) {
          showAlert('Erro', 'Não foi possível entrar com Google. Tente novamente.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [response]);

  return {
    signIn: () => promptAsync(),
    loading: !request,
  };
}
