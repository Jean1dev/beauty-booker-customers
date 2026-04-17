import auth, { GoogleAuthProvider } from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';

import { showAlert } from '@/platform/alert';

const webClientId =
  (Constants.expoConfig?.extra as { googleWebClientId?: string } | undefined)
    ?.googleWebClientId ?? '';

function describeCaughtError(error: unknown): string {
  if (error == null) return String(error);
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    const code =
      'code' in error && (error as { code?: unknown }).code != null
        ? `code: ${String((error as { code: unknown }).code)}\n`
        : '';
    return `${code}${error.name}: ${error.message}${error.stack ? `\n\n${error.stack}` : ''}`;
  }
  if (typeof error === 'object') {
    try {
      return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId });
  configured = true;
}

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    if (!webClientId) {
      showAlert(
        'Erro',
        'Client ID Web do Google não está configurado. Defina EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ou garanta que o google-services.json tenha um OAuth client do tipo Web.',
      );
      return;
    }

    setLoading(true);
    try {
      ensureConfigured();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const result = await GoogleSignin.signIn();
      const idToken =
        (result as { data?: { idToken?: string | null } }).data?.idToken ??
        (result as { idToken?: string | null }).idToken ??
        null;

      if (!idToken) {
        showAlert('Erro', 'Google não devolveu o token de identidade.');
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
        if (error.code === statusCodes.IN_PROGRESS) return;
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          showAlert('Erro', 'Google Play Services indisponível ou desatualizado.');
          return;
        }
      }
      showAlert(
        'Erro',
        `Não foi possível entrar com Google. Detalhes:\n\n${describeCaughtError(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { signIn, loading };
}
