import fs from 'fs';
import path from 'path';

const FILES = {
  googleServicesJson: 'google-services.json',
  googleServicesAndroid: path.join('android', 'app', 'google-services.json'),
  iosPlist: 'GoogleService-Info.plist',
};

const OAUTH_CLIENT_TYPE = { ANDROID: 1, IOS: 2, WEB: 3 };

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function jsonToCanonicalString(parsed) {
  if (parsed !== null && typeof parsed === 'object') {
    return JSON.stringify(parsed);
  }
  return null;
}

function tryParseJsonToCanonical(raw) {
  try {
    return jsonToCanonicalString(JSON.parse(raw));
  } catch {
    return null;
  }
}

function tryDecodeBase64JsonToCanonical(trimmed) {
  try {
    const decoded = Buffer.from(trimmed.replace(/\s/g, ''), 'base64').toString('utf8');
    return tryParseJsonToCanonical(stripBom(decoded).trim());
  } catch {
    return null;
  }
}

function normalizeGoogleServicesJson(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  const trimmed = stripBom(raw).trim();
  if (!trimmed) return null;

  const asJson = tryParseJsonToCanonical(trimmed);
  if (asJson) return asJson;

  return tryDecodeBase64JsonToCanonical(trimmed);
}

function readUtf8IfExists(relativePath) {
  if (!fs.existsSync(relativePath)) return null;
  return fs.readFileSync(relativePath, 'utf8');
}

function writeIosPlistFromEnvIfPresent(plistEnv) {
  if (!plistEnv) return;
  fs.writeFileSync(FILES.iosPlist, plistEnv, 'utf8');
}

function loadCanonicalGoogleServicesJson() {
  const fromEnv = process.env.GOOGLE_SERVICES_JSON
    ? normalizeGoogleServicesJson(process.env.GOOGLE_SERVICES_JSON)
    : null;
  if (fromEnv) {
    persistCanonicalGoogleServices(fromEnv);
    return fromEnv;
  }

  const fromRoot = normalizeGoogleServicesJson(readUtf8IfExists(FILES.googleServicesJson) ?? '');
  if (fromRoot) {
    persistCanonicalGoogleServices(fromRoot);
    return fromRoot;
  }

  const fromAndroid = normalizeGoogleServicesJson(
    readUtf8IfExists(FILES.googleServicesAndroid) ?? '',
  );
  if (fromAndroid) {
    persistCanonicalGoogleServices(fromAndroid);
    return fromAndroid;
  }

  return null;
}

function persistCanonicalGoogleServices(canonicalJson) {
  fs.writeFileSync(FILES.googleServicesJson, canonicalJson, 'utf8');
}

function extractOAuthClientIds(canonicalGoogleServicesJson) {
  const empty = {
    web: '',
    ios: '',
    android: '',
  };
  if (!canonicalGoogleServicesJson) return empty;
  try {
    const data = JSON.parse(canonicalGoogleServicesJson);
    const oauthClients = data.client?.[0]?.oauth_client ?? [];
    const idFor = (type) =>
      oauthClients.find((c) => c.client_type === type)?.client_id ?? '';
    return {
      web: idFor(OAUTH_CLIENT_TYPE.WEB),
      ios: idFor(OAUTH_CLIENT_TYPE.IOS),
      android: idFor(OAUTH_CLIENT_TYPE.ANDROID),
    };
  } catch {
    return empty;
  }
}

function expoGoogleServicesPath(canonicalJson) {
  return canonicalJson ? './google-services.json' : undefined;
}

function expoIosPlistPathIfFileExists() {
  return fs.existsSync(FILES.iosPlist) ? './GoogleService-Info.plist' : undefined;
}

function buildExpoConfig({ googleServicesFile, iosGoogleServicesFile, oauthIds }) {
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
        ...(iosGoogleServicesFile ? { googleServicesFile: iosGoogleServicesFile } : {}),
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
        ...(googleServicesFile ? { googleServicesFile } : {}),
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
        googleWebClientId: oauthIds.web,
        googleIosClientId: oauthIds.ios,
        googleAndroidClientId: oauthIds.android,
        router: {},
        eas: { projectId: '937cf1d1-0ecb-4092-975c-1d9ab5e6f5a5' },
      },
      owner: 'jeanlucafp',
    },
  };
}

export default () => {
  writeIosPlistFromEnvIfPresent(process.env.GOOGLE_SERVICES_PLIST);

  const canonicalGoogleServices = loadCanonicalGoogleServicesJson();
  const oauthIds = extractOAuthClientIds(canonicalGoogleServices);

  return buildExpoConfig({
    googleServicesFile: expoGoogleServicesPath(canonicalGoogleServices),
    iosGoogleServicesFile: expoIosPlistPathIfFileExists(),
    oauthIds,
  });
};
