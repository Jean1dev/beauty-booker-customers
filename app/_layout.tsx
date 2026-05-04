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
import { Stack, useRouter, useSegments } from 'expo-router';
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
  const segments = useSegments();
  const router = useRouter();

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

  const currentSegment = segments[0];

  useEffect(() => {
    if (!ready) return;

    const inWelcome = currentSegment === 'welcome';
    const inSetupPhone = currentSegment === 'setup-phone';
    const inAuthFlow = inWelcome || inSetupPhone;

    if (!user) {
      // Guests can browse /(tabs)/index freely.
      // Redirect only if they somehow land on setup-phone without being logged in.
      if (inSetupPhone) router.replace('/welcome');
      return;
    }

    if (!profile?.phone) {
      if (!inSetupPhone) router.replace('/setup-phone');
      return;
    }

    if (inAuthFlow) router.replace('/(tabs)');
  }, [ready, user, profile?.phone, currentSegment, router]);

  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
        <Stack.Screen name="welcome"     options={{ headerShown: false }} />
        <Stack.Screen name="setup-phone" options={{ headerShown: false }} />
        <Stack.Screen name="modal"       options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
