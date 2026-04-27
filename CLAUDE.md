# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
npx expo start           # start with platform picker
npx expo start --web     # web only
npx expo start --android # Android (requires emulator or device)
npx expo start --ios     # iOS (macOS + Xcode only)

# Android emulator helpers
npm run android:emu      # start AVD
npm run android:wait     # wait for boot
npm run android          # run on emulator

# Quality
npm run lint             # ESLint via expo lint

# Tests (after setup — see TESTING_GUIDE.md)
npm test                 # run all tests
npm run test:watch       # watch mode
npm run test:coverage    # coverage report
npx jest path/to/file    # run a single test file

# Dependencies — always use for native packages
npx expo install <pkg>   # resolves version compatible with SDK 54
npm install <pkg>         # only for pure JS packages (zod, date-fns, etc.)
```

## Architecture

### Auth flow

`app/_layout.tsx` is the auth guard. It reads `user` and `profile.phone` from the Zustand store (populated by `hooks/useAuth.ts`) and redirects:

- No user → `/welcome`
- User but no phone → `/setup-phone`
- User + phone → `/(tabs)`

`useAuth` subscribes to Firebase auth state changes (via `platform/auth`), calls `services/customers.ensureCustomerDoc` on sign-in, and writes into the Zustand store (`store/authStore.ts`).

### State management

Single Zustand store at `store/authStore.ts`. Holds `user`, `profile`, and `loading`. Components consume via selectors: `useAuthStore((s) => s.user)`.

### Platform abstraction (`platform/`)

All platform-specific code lives here. Metro resolves `.native.ts` / `.web.ts` suffixes automatically. **Never use `Platform.OS` inside screens or shared components for logic** — always add a file pair in `platform/`.

| Module | Purpose |
|--------|---------|
| `auth` | Firebase auth subscription / signOut — RNFB on native, JS SDK on web |
| `google-auth` | Google Sign-In hook — native SDK on native, `signInWithPopup` on web |
| `storage` | AsyncStorage on native, localStorage on web |
| `alert` | `Alert.alert` on native, `window.alert` on web |
| `share` | `Share` API on native, Web Share API on web |

### Firebase (hybrid SDKs)

| Layer | Web | iOS/Android |
|-------|-----|-------------|
| Auth | `firebase/auth` (JS SDK) | `@react-native-firebase/auth` |
| Firestore / Storage | `firebase/firestore` + `firebase/storage` | Same JS SDK |
| Google Sign-In | `signInWithPopup` | `@react-native-google-signin` |

`services/firebase.ts` initialises the JS SDK and exports `auth`, `db`, `storage`. Import from there — never call `getAuth()` without the app instance.

### Firestore collections

- `customers` — document ID = `uid`; fields: `name`, `email`, `photoUrl`, `phone`, `createdAt`
- `appointments` — queried by `clientPhone`; includes `serviceName`, `status`, `dateTime`

### Routing

File-based via Expo Router. Never create navigators manually. Use `router.push/replace` or `<Link href>`.

## Environment variables

All prefixed `EXPO_PUBLIC_` (required for Expo to expose them to the JS bundle). See AGENTS.md for the full list. Never commit `.env`.

For Android Google Sign-In to work, the app's SHA-1 must be registered in the Firebase console **before** downloading `google-services.json`.

## Safe Area / Dynamic Island — obrigatório em toda tela nova

**Toda tela nova deve aplicar `useSafeAreaInsets` para evitar sobreposição com Dynamic Island, notch e status bar.**

### Regra

- **Tab screens** (ScrollView com header próprio): usar `paddingTop: topInset + <base>` no `contentContainerStyle`
- **Auth/full-screen views** (layout centralizado com barra decorativa): aplicar `paddingTop: topInset` no view raiz
- **Nunca** usar `paddingTop` fixo no topo sem somar o `topInset`
- `SafeAreaProvider` já está no contexto via Expo Router — não é necessário adicionar manualmente

### Snippet — tab screen com ScrollView

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyScreen() {
  const { top: topInset } = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 24 }]}>
      {/* conteúdo */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    // NÃO coloque paddingTop aqui — aplique dinamicamente via topInset acima
  },
});
```

### Snippet — full-screen view (welcome / onboarding)

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyFullScreen() {
  const { top: topInset } = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      {/* decorative bar ou conteúdo */}
    </View>
  );
}
```

### Checklist para code review de nova tela

- [ ] Importa `useSafeAreaInsets` de `react-native-safe-area-context`
- [ ] Desestrutura `top: topInset` no corpo do componente
- [ ] Aplica `topInset` no `paddingTop` do container/ScrollView raiz
- [ ] Não usa valor fixo de `paddingTop` no topo sem `topInset`

## Testing

Full guide in `TESTING_GUIDE.md`. Stack: Jest + `@testing-library/react-native` (unit/integration) + Maestro (E2E).

Mocking conventions:
- Firebase: `jest.mock('@/services/firebase', () => ({ db: {}, auth: {}, storage: {} }))`
- Expo Router: `jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), useSegments: () => [] }))`
- Zustand: call `useAuthStore.setState({...})` in `beforeEach` to seed state per test
