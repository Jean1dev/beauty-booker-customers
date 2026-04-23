import fs from 'fs';

const ANDROID_GOOGLE_SERVICES_LOCAL = './google-services.json';
const IOS_GOOGLE_SERVICES_LOCAL = './GoogleService-Info.plist';

const resolveSecretFile = (envValue, localPath) => {
  if (envValue && fs.existsSync(envValue)) {
    return envValue;
  }

  if (envValue && envValue.trim().startsWith('{')) {
    fs.writeFileSync(localPath, envValue);
    return localPath;
  }

  if (envValue && envValue.trim().startsWith('<?xml')) {
    fs.writeFileSync(localPath, envValue);
    return localPath;
  }

  if (fs.existsSync(localPath)) {
    return localPath;
  }

  return undefined;
};

export default () => {
  const androidGoogleServices = resolveSecretFile(
    process.env.GOOGLE_SERVICES_JSON,
    ANDROID_GOOGLE_SERVICES_LOCAL,
  );

  const iosGoogleServices = resolveSecretFile(
    process.env.GOOGLE_SERVICES_PLIST,
    IOS_GOOGLE_SERVICES_LOCAL,
  );

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
        './plugins/withAdiRegistration', 
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
            ios: {
              useFrameworks: 'static',
              forceStaticLinking: ['RNFBApp', 'RNFBAuth'],
            },
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
