// Fallback entry for ESLint's import/no-unresolved (eslint-config-expo's resolver
// does not understand Metro's platform-suffix resolution).
//
// Metro's dev server prefers `.native.tsx` / `.web.tsx` over this file, but EAS
// production bundles have been observed loading this file instead. So this
// fallback MUST dispatch to the correct implementation at runtime — re-exporting
// the web stub statically would silently render null on iOS in production
// (the actual bug we just spent 6 PRs hunting).
import { Platform } from 'react-native';

const impl =
  Platform.OS === 'web'
    ? require('./apple-sign-in-button.web')
    : require('./apple-sign-in-button.native');

export const AppleSignInButton = impl.AppleSignInButton;
