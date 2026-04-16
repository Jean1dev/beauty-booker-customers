import fs from 'fs';

const ANDROID_GOOGLE_SERVICES = './google-services.json';
const IOS_GOOGLE_SERVICES = './GoogleService-Info.plist';

export default () => {
  if (process.env.GOOGLE_SERVICES_JSON) {
    fs.writeFileSync(ANDROID_GOOGLE_SERVICES, process.env.GOOGLE_SERVICES_JSON);
  }

  if (process.env.GOOGLE_SERVICES_PLIST) {
    fs.writeFileSync(IOS_GOOGLE_SERVICES, process.env.GOOGLE_SERVICES_PLIST);
  }

  const androidGoogleServices = fs.existsSync(ANDROID_GOOGLE_SERVICES)
    ? ANDROID_GOOGLE_SERVICES
    : undefined;

  const iosGoogleServices = fs.existsSync(IOS_GOOGLE_SERVICES)
    ? IOS_GOOGLE_SERVICES
    : undefined;

  return {
    expo: {
      name: 'beauty-book-customers',
      slug: 'beauty-book-customers',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/images/icon.png',
      scheme: 'beautybookcustomers',
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.jeanlucafp.beautybookcustomers',
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
        },
        ...(iosGoogleServices ? { googleServicesFile: iosGoogleServices } : {}),
      },
      android: {
        adaptiveIcon: {
          backgroundColor: '#E6F4FE',
          foregroundImage: './assets/images/android-icon-foreground.png',
          backgroundImage: './assets/images/android-icon-background.png',
          monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: 'com.jeanlucafp.beautybookcustomers',
        ...(androidGoogleServices ? { googleServicesFile: androidGoogleServices } : {}),
      },
      web: {
        output: 'static',
        favicon: './assets/images/favicon.png',
      },
      plugins: [
        'expo-router',
        [
          'expo-splash-screen',
          {
            image: './assets/images/splash-icon.png',
            imageWidth: 200,
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
            dark: { backgroundColor: '#000000' },
          },
        ],
        '@react-native-firebase/app',
        '@react-native-firebase/auth',
        '@react-native-google-signin/google-signin',
        [
          'expo-build-properties',
          {
            ios: { useFrameworks: 'static' },
          },
        ],
      ],
      experiments: {
        typedRoutes: true,
        reactCompiler: true,
      },
      extra: {
        googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
        router: {},
        eas: { projectId: '937cf1d1-0ecb-4092-975c-1d9ab5e6f5a5' },
      },
      owner: 'jeanlucafp',
    },
  };
};
