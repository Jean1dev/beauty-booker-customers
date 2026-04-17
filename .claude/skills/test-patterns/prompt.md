# Skill: test-patterns

Você é um especialista em testes para este projeto React Native / Expo. Use este guia ao criar qualquer teste.

## Stack de testes

- **Jest** via preset `jest-expo`
- **@testing-library/react-native** para testes de componentes e hooks
- Testes ficam em `__tests__/<mesma-estrutura-que-src>/`
- Arquivo de nome: `<modulo>.test.ts` ou `<modulo>.test.tsx`

## Padrões de mock obrigatórios

### Firebase (`services/firebase`)
```ts
jest.mock('@/services/firebase', () => ({
  db:      {},
  auth:    { currentUser: null },
  storage: {},
}));
```

### Firestore (funções individuais)
```ts
const mockGetDoc    = jest.fn();
const mockSetDoc    = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc       = jest.fn(() => ({ path: 'col/id' }));
const mockOnSnapshot = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc:         (...a: any[]) => mockDoc(...a),
  getDoc:      ()            => mockGetDoc(),
  setDoc:      (...a: any[]) => mockSetDoc(...a),
  updateDoc:   (...a: any[]) => mockUpdateDoc(...a),
  collection:  jest.fn(),
  query:       jest.fn(),
  where:       jest.fn(),
  onSnapshot:  (...a: any[]) => mockOnSnapshot(...a),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}));
```

### Expo Router
```ts
const mockPush    = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter:   () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useSegments: () => [],
  Link:        ({ children }: any) => children,
  Stack:       { Screen: () => null },
}));
```

### Zustand (authStore)
```ts
import { useAuthStore } from '@/store/authStore';

// Em beforeEach: seed do estado para o teste
beforeEach(() => {
  useAuthStore.setState({
    user:    null,
    profile: null,
    loading: false,
  });
});
```

### platform/auth
```ts
jest.mock('@/platform/auth', () => ({
  subscribeAuth: jest.fn(),
  signOut:       jest.fn().mockResolvedValue(undefined),
}));
```

### platform/google-auth
```ts
jest.mock('@/platform/google-auth', () => ({
  useGoogleAuth: () => ({
    signIn:  jest.fn(),
    loading: false,
    error:   null,
  }),
}));
```

### React Native (módulos nativos)
O preset `jest-expo` já mocka a maioria. Se faltar algum:
```ts
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
```

## Convenções

- `describe` → nome do módulo/função
- `it` → frase que começa com verbo (deve, retorna, chama, exibe)
- Cada `it` testa **uma** coisa
- Sempre chamar `jest.clearAllMocks()` em `beforeEach`
- Para hooks: usar `renderHook` + `act` de `@testing-library/react-native`
- Para componentes: usar `render` + `screen` (screen queries > container queries)
- Para asserts de texto em PT-BR: usar `getByText(/texto/i)` com regex case-insensitive

## Estrutura de arquivo de teste

```ts
// __tests__/<caminho>/<arquivo>.test.ts
import { funcaoTestada } from '@/<caminho>/<arquivo>';

// mocks no topo, fora de describe

describe('<NomeDoModulo>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // seed de estado se necessário
  });

  describe('<subcontexto opcional>', () => {
    it('<deve fazer algo>', () => {
      // arrange
      // act
      // assert
    });
  });
});
```

## Níveis de teste (resumo)

| Nível | Local | Ferramentas |
|-------|-------|-------------|
| Unitário (store, utils) | `__tests__/store/`, `__tests__/utils/` | Jest puro |
| Integração (services, hooks) | `__tests__/services/`, `__tests__/hooks/` | Jest + mocks Firestore |
| Componentes/telas | `__tests__/screens/`, `__tests__/components/` | testing-library/react-native |
| E2E | `.maestro/` | Maestro |

## Comandos

```bash
npm test                   # todos os testes
npm run test:watch         # watch
npm run test:coverage      # cobertura
npx jest __tests__/store   # pasta específica
npx jest authStore         # arquivo por padrão de nome
```
