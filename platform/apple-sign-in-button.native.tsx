import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { useAppleSignIn } from './apple-auth.native';

const BUTTON_HEIGHT = 52;

export function AppleSignInButton() {
  const { signIn, isAvailable } = useAppleSignIn();
  const dark = useColorScheme() === 'dark';
  const [measuredWidth, setMeasuredWidth] = useState(0);

  return (
    <View style={styles.diagnosticRoot}>
      <View style={styles.diagnosticBanner}>
        <Text style={styles.diagnosticText}>
          DEBUG: NATIVE FILE LOADED · isAvailable={String(isAvailable)} · w={measuredWidth}
        </Text>
      </View>
      {isAvailable && (
        <View
          style={styles.wrapper}
          onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}>
          {measuredWidth > 0 && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                dark
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={BUTTON_HEIGHT / 2}
              style={{ width: measuredWidth, height: BUTTON_HEIGHT }}
              onPress={signIn}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  diagnosticRoot: {
    alignSelf: 'stretch',
    gap: 8,
  },
  diagnosticBanner: {
    backgroundColor: '#1a8754',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  diagnosticText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
  },
  wrapper: {
    alignSelf: 'stretch',
    height: BUTTON_HEIGHT,
  },
});
