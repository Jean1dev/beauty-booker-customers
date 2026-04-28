import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { useAppleSignIn } from './apple-auth.native';

const BUTTON_HEIGHT = 52;

export function AppleSignInButton() {
  const { signIn, isAvailable } = useAppleSignIn();
  const dark = useColorScheme() === 'dark';
  const [measuredWidth, setMeasuredWidth] = useState(0);

  if (!isAvailable) return null;

  return (
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
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    height: BUTTON_HEIGHT,
  },
});
