import { createElement } from 'react';
import { Text, View } from 'react-native';

export function AppleSignInButton() {
  return createElement(
    View,
    {
      style: {
        backgroundColor: '#dc3545',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        alignSelf: 'stretch',
      },
    },
    createElement(
      Text,
      {
        style: {
          color: '#ffffff',
          fontSize: 11,
          textAlign: 'center',
          fontFamily: 'DMSans_500Medium',
        },
      },
      'DEBUG: FALLBACK .ts FILE LOADED (Metro picked the wrong file)',
    ),
  );
}
