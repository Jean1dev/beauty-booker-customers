import {
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, profile, loading: authLoading } = useAuth();

  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  const ready = fontsLoaded && !authLoading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  let redirect: string;
  if (!user) {
    redirect = '/welcome';
  } else if (!profile?.phone) {
    redirect = '/setup-phone';
  } else {
    redirect = '/(tabs)';
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
        <Stack.Screen name="welcome"     options={{ headerShown: false }} />
        <Stack.Screen name="setup-phone" options={{ headerShown: false }} />
        <Stack.Screen name="modal"       options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>

      <Redirect href={redirect as any} />

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
