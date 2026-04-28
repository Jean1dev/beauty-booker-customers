import * as AppleAuthentication from 'expo-apple-authentication';
import { StyleSheet, View } from 'react-native';
import { useColorScheme } from 'react-native';

import { useAppleSignIn } from './apple-auth.native';

export function AppleSignInButton() {
  const { signIn, loading, isAvailable } = useAppleSignIn();
  const dark = useColorScheme() === 'dark';

  if (!isAvailable) return null;

  return (
    <View style={styles.wrapper}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          dark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={999}
        style={styles.button}
        onPress={signIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  button: {
    width: '100%',
    height: 52,
  },
});
