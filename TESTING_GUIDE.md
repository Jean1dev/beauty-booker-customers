# Guia de Testes — Beauty Booker Customers

## Contexto

Aplicativo cross-platform (iOS, Android, Web) construído com **Expo 54 + React Native + Firebase**. Atualmente com **zero cobertura de testes**. Este guia orienta a introdução de testes de forma incremental, priorizando as partes de maior risco e valor.

---

## Stack de Testes Recomendada

| Camada | Ferramenta | Motivo |
|--------|-----------|--------|
| Unit / Integração | **Jest** + **@testing-library/react-native** | Padrão do ecossistema Expo |
| Mocks Firebase | **@firebase/rules-unit-testing** + `jest.mock` | Isola chamadas ao Firestore/Auth |
| Mocks Zustand | `zustand/testing` (ou setup manual) | Testa componentes com estado isolado |
| E2E | **Maestro** (ou Detox) | Simula fluxos reais no device/emulador |
| Cobertura | `jest --coverage` + `c8` | Relatório de cobertura por arquivo |

### Instalação Inicial

```bash
npx expo install jest-expo @testing-library/react-native @testing-library/jest-native
npm install --save-dev @types/jest jest
```

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)"
    ]
  }
}
```

---

## Níveis de Teste

### Nível 1 — Testes Unitários

> **O que são:** Testam uma unidade isolada (função, hook, store) sem dependências externas.  
> **Quando usar:** Para lógica de negócio pura, utilitários e state management.  
> **Custo/Benefício:** Baixo custo, alto retorno — são os mais rápidos de escrever e executar.

#### 1.1 — Store Zustand (`store/authStore.ts`)

O store é pura lógica de estado sem efeitos colaterais. Prioridade **alta**.

```typescript
// __tests__/store/authStore.test.ts
import { useAuthStore } from '@/store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false });
  });

  it('deve iniciar com estado vazio', () => {
    const { user, profile, loading } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(profile).toBeNull();
    expect(loading).toBe(false);
  });

  it('setUser deve atualizar o usuário', () => {
    const mockUser = { uid: '123', email: 'test@test.com', displayName: 'Test' };
    useAuthStore.getState().setUser(mockUser as any);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('setLoading deve alternar o estado de carregamento', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().loading).toBe(true);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('setProfile deve atualizar o perfil do cliente', () => {
    const mockProfile = { uid: '123', phone: '11999999999', name: 'Ana' };
    useAuthStore.getState().setProfile(mockProfile as any);
    expect(useAuthStore.getState().profile?.phone).toBe('11999999999');
  });
});
```

#### 1.2 — Utilitários de Phone Mask (`app/setup-phone.tsx`)

As funções `maskPhone` e `rawDigits` são puramente funcionais. Prioridade **alta**.

```typescript
// __tests__/utils/phoneMask.test.ts
import { maskPhone, rawDigits } from '@/app/setup-phone'; // extrair para utils/

describe('maskPhone', () => {
  it('formata número completo (11 dígitos)', () => {
    expect(maskPhone('11999887766')).toBe('(11) 99988-7766');
  });
  it('formata número parcial', () => {
    expect(maskPhone('119')).toBe('(11) 9');
  });
  it('retorna vazio para entrada vazia', () => {
    expect(maskPhone('')).toBe('');
  });
});

describe('rawDigits', () => {
  it('remove caracteres de formatação', () => {
    expect(rawDigits('(11) 99988-7766')).toBe('11999887766');
  });
  it('preserva apenas dígitos', () => {
    expect(rawDigits('abc123def456')).toBe('123456');
  });
});
```

> **Refatoração necessária:** Extrair `maskPhone` e `rawDigits` de `setup-phone.tsx` para `utils/phoneMask.ts` antes de testar.

#### 1.3 — Tema e Cores (`constants/theme.ts`, `hooks/use-theme-color.ts`)

```typescript
// __tests__/hooks/useThemeColor.test.ts
import { useThemeColor } from '@/hooks/use-theme-color';
import { renderHook } from '@testing-library/react-native';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));

describe('useThemeColor', () => {
  it('retorna cor do tema light', () => {
    const { result } = renderHook(() =>
      useThemeColor({ light: '#fff', dark: '#000' }, 'background')
    );
    expect(result.current).toBe('#fff');
  });
});
```

---

### Nível 2 — Testes de Integração

> **O que são:** Testam a interação entre múltiplas unidades (hook + store, componente + serviço).  
> **Quando usar:** Para fluxos que envolvem estado, Firebase ou navegação.  
> **Custo/Benefício:** Custo médio, detectam problemas de contrato entre módulos.

#### 2.1 — Hook `useAuth` (`hooks/useAuth.ts`)

O hook mais crítico da aplicação. Orquestra Firebase, Firestore e Zustand.

```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';

// Mock do módulo de plataforma
jest.mock('@/platform/auth', () => ({
  subscribeAuth: jest.fn(),
}));
jest.mock('@/services/customers', () => ({
  ensureCustomerDoc: jest.fn(),
}));
jest.mock('@/platform/google-auth', () => ({
  useGoogleAuth: () => ({ signOut: jest.fn() }),
}));

import { subscribeAuth } from '@/platform/auth';
import { ensureCustomerDoc } from '@/services/customers';

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve iniciar em estado de loading', () => {
    (subscribeAuth as jest.Mock).mockImplementation(() => () => {});
    const { result } = renderHook(() => useAuth());
    // loading true no início (antes do Firebase responder)
    expect(result.current.loading).toBe(true);
  });

  it('deve atualizar user e profile após login bem-sucedido', async () => {
    const mockUser = { uid: 'abc', email: 'test@example.com', displayName: 'Test' };
    const mockProfile = { uid: 'abc', phone: '11999999999', name: 'Test' };

    (subscribeAuth as jest.Mock).mockImplementation((cb) => {
      cb(mockUser);
      return () => {};
    });
    (ensureCustomerDoc as jest.Mock).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useAuth());

    await act(async () => {});

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.profile).toEqual(mockProfile);
  });

  it('deve limpar estado após logout (user null)', async () => {
    (subscribeAuth as jest.Mock).mockImplementation((cb) => {
      cb(null);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });
});
```

#### 2.2 — Serviço de Customers (`services/customers.ts`)

```typescript
// __tests__/services/customers.test.ts
import { ensureCustomerDoc, updateCustomerPhone } from '@/services/customers';

// Mock do Firestore
jest.mock('@/services/firebase', () => ({
  db: {},
}));

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn((db, col, id) => ({ path: `${col}/${id}` }));

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: () => mockGetDoc(),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}));

describe('ensureCustomerDoc', () => {
  const mockAuthUser = {
    uid: 'user123',
    email: 'user@test.com',
    displayName: 'Test User',
    photoURL: null,
  };

  it('retorna perfil existente sem criar novo doc', async () => {
    const existingProfile = { uid: 'user123', name: 'Test User', phone: '11999' };
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existingProfile });

    const result = await ensureCustomerDoc(mockAuthUser as any);
    expect(result).toEqual(existingProfile);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('cria novo doc quando cliente não existe', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await ensureCustomerDoc(mockAuthUser as any);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});

describe('updateCustomerPhone', () => {
  it('chama updateDoc com phone correto', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await updateCustomerPhone('user123', '11999887766');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { phone: '11999887766' }
    );
  });
});
```

#### 2.3 — Serviço de Appointments (`services/appointments.ts`)

```typescript
// __tests__/services/appointments.test.ts
import { subscribeAppointments } from '@/services/appointments';

const mockOnSnapshot = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
}));
jest.mock('@/services/firebase', () => ({ db: {} }));

describe('subscribeAppointments', () => {
  it('chama onData com appointments formatados', () => {
    const mockDocs = [
      { id: 'apt1', data: () => ({ clientPhone: '11999', serviceName: 'Corte', status: 'confirmed' }) },
    ];
    mockOnSnapshot.mockImplementation((query, onNext) => {
      onNext({ docs: mockDocs });
      return jest.fn(); // unsubscribe
    });

    const onData = jest.fn();
    const unsubscribe = subscribeAppointments('11999', onData, jest.fn());

    expect(onData).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'apt1', serviceName: 'Corte' }),
    ]);
    expect(typeof unsubscribe).toBe('function');
  });

  it('chama onError quando Firestore falha', () => {
    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      onError(new Error('Firestore error'));
      return jest.fn();
    });

    const onError = jest.fn();
    subscribeAppointments('11999', jest.fn(), onError);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
```

#### 2.4 — Abstração de Plataforma (`platform/`)

```typescript
// __tests__/platform/storage.test.ts
// Testar web e native separadamente

describe('storage.web', () => {
  beforeEach(() => localStorage.clear());

  it('setItem persiste no localStorage', async () => {
    const { setItem, getItem } = await import('@/platform/storage.web');
    await setItem('key', 'value');
    expect(await getItem('key')).toBe('value');
  });

  it('removeItem limpa a chave', async () => {
    const { setItem, removeItem, getItem } = await import('@/platform/storage.web');
    await setItem('key', 'value');
    await removeItem('key');
    expect(await getItem('key')).toBeNull();
  });
});
```

---

### Nível 3 — Testes de Componentes

> **O que são:** Renderizam componentes React Native e testam comportamento do ponto de vista do usuário.  
> **Quando usar:** Para validar UI, interações e renderização condicional.  
> **Custo/Benefício:** Custo médio-alto; detectam regressões visuais e de UX.

#### 3.1 — Componentes Base

```typescript
// __tests__/components/ThemedText.test.tsx
import { render, screen } from '@testing-library/react-native';
import { ThemedText } from '@/components/themed-text';

describe('ThemedText', () => {
  it('renderiza texto corretamente', () => {
    render(<ThemedText>Olá mundo</ThemedText>);
    expect(screen.getByText('Olá mundo')).toBeTruthy();
  });

  it('aplica tipo title com estilo correto', () => {
    render(<ThemedText type="title">Título</ThemedText>);
    const el = screen.getByText('Título');
    expect(el.props.style).toContainEqual(expect.objectContaining({ fontSize: expect.any(Number) }));
  });
});
```

#### 3.2 — Tela de Welcome (`app/welcome.tsx`)

```typescript
// __tests__/screens/welcome.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '@/app/welcome';

jest.mock('@/platform/google-auth', () => ({
  useGoogleAuth: () => ({
    signIn: jest.fn(),
    loading: false,
    error: null,
  }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('WelcomeScreen', () => {
  it('renderiza botão de login com Google', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(/Entrar com Google/i)).toBeTruthy();
  });

  it('chama signIn ao pressionar o botão', () => {
    const signIn = jest.fn();
    jest.mocked(require('@/platform/google-auth').useGoogleAuth).mockReturnValue({
      signIn, loading: false, error: null,
    });

    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText(/Entrar com Google/i));
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('desabilita botão durante loading', () => {
    jest.mocked(require('@/platform/google-auth').useGoogleAuth).mockReturnValue({
      signIn: jest.fn(), loading: true, error: null,
    });

    render(<WelcomeScreen />);
    const btn = screen.getByText(/Entrar com Google/i);
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });
});
```

#### 3.3 — Tela de Setup Phone (`app/setup-phone.tsx`)

```typescript
// __tests__/screens/setup-phone.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SetupPhoneScreen from '@/app/setup-phone';

jest.mock('@/services/customers', () => ({ updateCustomerPhone: jest.fn() }));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ user: { uid: '123' }, profile: null, setProfile: jest.fn() }),
}));

describe('SetupPhoneScreen', () => {
  it('aplica máscara ao digitar telefone', () => {
    render(<SetupPhoneScreen />);
    const input = screen.getByPlaceholderText(/\(11\)/i);
    fireEvent.changeText(input, '11999887766');
    expect(input.props.value).toBe('(11) 99988-7766');
  });

  it('bloqueia submit com telefone incompleto', async () => {
    render(<SetupPhoneScreen />);
    const input = screen.getByPlaceholderText(/\(11\)/i);
    fireEvent.changeText(input, '119');
    fireEvent.press(screen.getByText(/Continuar/i));
    expect(await screen.findByText(/inválido/i)).toBeTruthy();
  });
});
```

#### 3.4 — Tela de Agenda (`app/(tabs)/agenda.tsx`)

```typescript
// __tests__/screens/agenda.test.tsx
import { render, screen } from '@testing-library/react-native';
import AgendaScreen from '@/app/(tabs)/agenda';

jest.mock('@/services/appointments', () => ({
  subscribeAppointments: (phone: string, onData: Function) => {
    onData([
      {
        id: '1',
        serviceName: 'Corte de Cabelo',
        status: 'confirmed',
        dateTime: new Date('2026-05-01T10:00:00'),
        clientPhone: '11999',
      },
    ]);
    return jest.fn();
  },
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (sel: any) => sel({
    profile: { phone: '11999', name: 'Ana' },
    user: { uid: '123' },
  }),
}));

describe('AgendaScreen', () => {
  it('exibe card de agendamento', async () => {
    render(<AgendaScreen />);
    expect(await screen.findByText('Corte de Cabelo')).toBeTruthy();
  });

  it('exibe mensagem quando não há agendamentos', async () => {
    jest.resetModules();
    jest.mock('@/services/appointments', () => ({
      subscribeAppointments: (_: string, onData: Function) => {
        onData([]);
        return jest.fn();
      },
    }));
    render(<AgendaScreen />);
    expect(await screen.findByText(/nenhum agendamento/i)).toBeTruthy();
  });
});
```

---

### Nível 4 — Testes de Navegação / Fluxo

> **O que são:** Testam transições de rota e guards de autenticação usando Expo Router + estado Zustand.  
> **Quando usar:** Para validar regras de redirecionamento (usuário não autenticado, sem telefone, etc).  
> **Custo/Benefício:** Alto valor para fluxos críticos de onboarding.

#### 4.1 — Root Layout Auth Guard (`app/_layout.tsx`)

```typescript
// __tests__/navigation/authGuard.test.tsx
import { render } from '@testing-library/react-native';
import RootLayout from '@/app/_layout';

// O root layout redireciona baseado em: user + profile?.phone + segmento atual
// Casos a cobrir:

describe('Auth Guard', () => {
  it('redireciona para /welcome quando usuário não autenticado', () => {
    // Mock: user = null, loading = false
    // Esperado: router.replace('/welcome')
  });

  it('redireciona para /setup-phone quando sem telefone', () => {
    // Mock: user existe, profile.phone = '', loading = false
    // Esperado: router.replace('/setup-phone')
  });

  it('redireciona para /(tabs) quando autenticado com telefone', () => {
    // Mock: user existe, profile.phone = '11999', loading = false
    // Esperado: router.replace('/(tabs)')
  });

  it('não redireciona durante carregamento', () => {
    // Mock: loading = true
    // Esperado: nenhum replace chamado
  });
});
```

---

### Nível 5 — Testes E2E (End-to-End)

> **O que são:** Executam o app real em emulador/device, simulando ações do usuário de ponta a ponta.  
> **Quando usar:** Para fluxos de negócio críticos que não podem ser validados por mocks.  
> **Custo/Benefício:** Alto custo de manutenção, máximo de confiança — usar seletivamente.

#### Ferramenta Recomendada: Maestro

```yaml
# .maestro/flows/login_flow.yaml
appId: com.beautybooker.customers
---
- launchApp
- assertVisible: "Bem-vindo"
- tapOn: "Entrar com Google"
# (Google Sign-In mockado via test account ou bypass)
- assertVisible: "Início"
- tapOn: "Agenda"
- assertVisible: "Meus Agendamentos"
```

```yaml
# .maestro/flows/setup_phone_flow.yaml
appId: com.beautybooker.customers
---
- launchApp
# Usuário autenticado sem telefone → redirecionado para setup-phone
- assertVisible: "Seu telefone"
- tapOn:
    id: "phone-input"
- inputText: "11999887766"
- assertVisible: "(11) 99988-7766"
- tapOn: "Continuar"
- assertVisible: "Início"
```

#### Cenários E2E Prioritários

| # | Fluxo | Prioridade |
|---|-------|-----------|
| 1 | Login com Google → redirecionamento para home | Alta |
| 2 | Cadastro de telefone → acesso às tabs | Alta |
| 3 | Visualização de agendamentos futuros | Alta |
| 4 | Logout → retorno para welcome | Média |
| 5 | Visualização de histórico de agendamentos | Média |
| 6 | Navegação entre as 3 tabs principais | Baixa |

---

## Plano de Implementação

### Fase 1 — Fundação (Semana 1)

- [ ] Configurar Jest + testing-library no projeto
- [ ] Testar `authStore` (Zustand)
- [ ] Extrair `maskPhone`/`rawDigits` para `utils/phoneMask.ts`
- [ ] Testar utilitários de phone mask

### Fase 2 — Serviços e Hooks (Semana 2)

- [ ] Testar `useAuth` com mocks de Firebase
- [ ] Testar `services/customers.ts`
- [ ] Testar `services/appointments.ts`
- [ ] Testar `platform/storage` (web + native)

### Fase 3 — Componentes e Telas (Semana 3)

- [ ] Testar componentes base (ThemedText, ThemedView)
- [ ] Testar WelcomeScreen (botão, loading, erro)
- [ ] Testar SetupPhoneScreen (máscara, validação, submit)
- [ ] Testar AgendaScreen (lista, vazio, erro)

### Fase 4 — Navegação e E2E (Semana 4)

- [ ] Configurar Maestro
- [ ] Implementar fluxo de login E2E
- [ ] Implementar fluxo de setup-phone E2E
- [ ] Configurar CI para rodar testes em PRs

---

## Cobertura Mínima por Módulo

| Módulo | Meta de Cobertura | Justificativa |
|--------|------------------|---------------|
| `store/authStore.ts` | 100% | Lógica crítica, pura e testável |
| `services/customers.ts` | 90% | Dado persistido no Firestore |
| `services/appointments.ts` | 85% | Dados em tempo real exibidos ao usuário |
| `hooks/useAuth.ts` | 85% | Orquestrador central de auth |
| `platform/` (web) | 80% | Abstração multiplataforma |
| `app/setup-phone.tsx` | 75% | Validação de entrada do usuário |
| `app/welcome.tsx` | 70% | Ponto de entrada do auth |
| `components/` | 60% | Componentes de UI estáveis |

---

## Padrões de Mock

### Padrão Firebase

```typescript
// __tests__/setup/firebaseMocks.ts
jest.mock('@/services/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));
```

### Padrão Expo Router

```typescript
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSegments: () => ['(tabs)'],
  Link: ({ children }: any) => children,
}));
```

### Padrão Zustand em Componentes

```typescript
// Sobrescreve estado para o teste sem afetar outros
import { useAuthStore } from '@/store/authStore';
beforeEach(() => {
  useAuthStore.setState({
    user: mockUser,
    profile: mockProfile,
    loading: false,
  });
});
```

---

## Checklist de PR com Testes

Antes de abrir um PR, verificar:

- [ ] Novos utilitários têm testes unitários
- [ ] Novos hooks têm testes de integração com mocks
- [ ] Novos serviços Firebase têm testes com Firestore mockado
- [ ] Novas telas têm pelo menos 1 teste de renderização e 1 de interação
- [ ] Fluxos de auth não quebraram os testes existentes
- [ ] `npm test` passa sem erros
- [ ] Cobertura da módulo alterado não caiu abaixo da meta
