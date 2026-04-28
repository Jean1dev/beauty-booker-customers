// Fallback entry for ESLint's import/no-unresolved. See apple-sign-in-button.ts
// for full context — same dispatch pattern, same reason.
import { Platform } from 'react-native';

const impl =
  Platform.OS === 'web'
    ? require('./apple-auth.web')
    : require('./apple-auth.native');

export const useAppleSignIn = impl.useAppleSignIn;
