import fs from 'fs';

export default () => {
  const googleServicesEnv = process.env.GOOGLE_SERVICES_JSON;

  if (googleServicesEnv) {
    fs.writeFileSync('./android/app/google-services.json', googleServicesEnv);
  }

  let googleWebClientId = '';
  try {
    const raw = googleServicesEnv ?? fs.readFileSync('./google-services.json', 'utf8');
    const json = JSON.parse(raw);
    const webClient = json.client?.[0]?.oauth_client?.find(c => c.client_type === 3);
    googleWebClientId = webClient?.client_id ?? '';
  } catch {}

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
        googleServicesFile: './android/app/google-services.json',
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
      ],
      experiments: {
        typedRoutes: true,
        reactCompiler: true,
      },
      extra: {
        googleWebClientId,
        router: {},
        eas: { projectId: '937cf1d1-0ecb-4092-975c-1d9ab5e6f5a5' },
      },
      owner: 'jeanlucafp',
    },
  };
};
