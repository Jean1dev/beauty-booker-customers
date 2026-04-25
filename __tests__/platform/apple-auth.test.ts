import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAppleSignIn } from '@/platform/apple-auth.native';

// ── Call-order tracker ────────────────────────────────────────────────────────

const callOrder: string[] = [];

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockIsAvailable = jest.fn();
const mockAppleSignIn = jest.fn();

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailable(...args),
  signInAsync:      (...args: unknown[]) => mockAppleSignIn(...args),
  AppleAuthenticationScope: { FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL' },
}));

const mockCryptoDigest = jest.fn();

jest.mock('expo-crypto', () => ({
  digestStringAsync:      (...args: unknown[]) => mockCryptoDigest(...args),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

const mockRnfbSignIn  = jest.fn();
const mockRnfbSignOut = jest.fn();

jest.mock('@react-native-firebase/auth', () => {
  const instance = {
    signInWithCredential: (...args: unknown[]) => mockRnfbSignIn(...args),
    signOut:              (...args: unknown[]) => mockRnfbSignOut(...args),
  };
  const authFn = jest.fn(() => instance);
  (authFn as any).AppleAuthProvider = {
    credential: jest.fn((token: string, nonce: string) => ({ token, nonce })),
  };
  return { __esModule: true, default: authFn };
});

const mockJsSignIn  = jest.fn();
const mockJsSignOut = jest.fn();

jest.mock('firebase/auth', () => ({
  OAuthProvider: jest.fn().mockImplementation(() => ({
    credential: jest.fn((opts: unknown) => ({ provider: 'apple.com', ...((opts as object) ?? {}) })),
  })),
  signInWithCredential: (...args: unknown[]) => mockJsSignIn(...args),
  signOut:              (...args: unknown[]) => mockJsSignOut(...args),
}));

jest.mock('@/services/firebase', () => ({ auth: {}, db: {}, storage: {} }));

const mockShowAlert = jest.fn();
jest.mock('@/platform/alert', () => ({
  showAlert: (...args: unknown[]) => mockShowAlert(...args),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const identityToken = 'apple-id-token-xyz';
const hashedNonce   = 'hashed-nonce-abc';

const appleResult = {
  identityToken,
  user:              'apple-user-123',
  fullName:          { givenName: 'Ana', familyName: 'Lima' },
  email:             'ana@privaterelay.appleid.com',
  realUserStatus:    1,
  state:             null,
  authorizationCode: 'auth-code',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  callOrder.length = 0;

  mockIsAvailable.mockResolvedValue(true);
  mockCryptoDigest.mockResolvedValue(hashedNonce);
  mockAppleSignIn.mockResolvedValue(appleResult);
  mockJsSignIn.mockImplementation(async () => { callOrder.push('js-sdk'); });
  mockRnfbSignIn.mockImplementation(async () => { callOrder.push('rnfb'); });
  mockJsSignOut.mockResolvedValue(undefined);
  mockRnfbSignOut.mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAppleSignIn — disponibilidade do dispositivo', () => {
  it('começa com isAvailable=false antes de isAvailableAsync resolver', () => {
    mockIsAvailable.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAppleSignIn());
    expect(result.current.isAvailable).toBe(false);
  });

  it('define isAvailable=true quando Apple Sign-In é suportado', async () => {
    mockIsAvailable.mockResolvedValue(true);
    const { result } = renderHook(() => useAppleSignIn());
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
  });

  it('mantém isAvailable=false quando dispositivo não suporta Apple Sign-In', async () => {
    mockIsAvailable.mockResolvedValue(false);
    const { result } = renderHook(() => useAppleSignIn());
    await waitFor(() => expect(mockIsAvailable).toHaveBeenCalled());
    expect(result.current.isAvailable).toBe(false);
  });

  it('mantém isAvailable=false se isAvailableAsync lançar erro', async () => {
    mockIsAvailable.mockRejectedValue(new Error('Not supported'));
    const { result } = renderHook(() => useAppleSignIn());
    await waitFor(() => expect(mockIsAvailable).toHaveBeenCalled());
    expect(result.current.isAvailable).toBe(false);
  });
});

describe('useAppleSignIn — ordem de autenticação (fix race condition)', () => {
  it('autentica JS SDK antes do RNFB para que Firestore esteja disponível quando onAuthStateChanged disparar', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(callOrder).toEqual(['js-sdk', 'rnfb']);
  });

  it('invocationCallOrder confirma: jsSignInWithCredential < auth().signInWithCredential', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignIn).toHaveBeenCalledTimes(1);
    expect(mockRnfbSignIn).toHaveBeenCalledTimes(1);
    expect(mockJsSignIn.mock.invocationCallOrder[0])
      .toBeLessThan(mockRnfbSignIn.mock.invocationCallOrder[0]);
  });

  it('ambos os SDKs são chamados em um sign-in bem-sucedido', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignIn).toHaveBeenCalledTimes(1);
    expect(mockRnfbSignIn).toHaveBeenCalledTimes(1);
  });
});

describe('useAppleSignIn — rollback quando RNFB falha', () => {
  beforeEach(() => {
    mockRnfbSignIn.mockRejectedValue(new Error('RNFB Apple credential error'));
  });

  it('faz signOut no JS SDK para reverter a sessão', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignOut).toHaveBeenCalledTimes(1);
  });

  it('exibe alerta de erro ao usuário', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.any(String));
  });
});

describe('useAppleSignIn — JS SDK falha antes do RNFB', () => {
  beforeEach(() => {
    mockJsSignIn.mockRejectedValue(new Error('JS SDK error'));
  });

  it('não chama RNFB quando JS SDK falha', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockRnfbSignIn).not.toHaveBeenCalled();
  });

  it('não faz rollback (RNFB nunca foi chamado)', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockRnfbSignOut).not.toHaveBeenCalled();
  });
});

describe('useAppleSignIn — estado de loading', () => {
  it('começa com loading=false', () => {
    const { result } = renderHook(() => useAppleSignIn());
    expect(result.current.loading).toBe(false);
  });

  it('loading=true durante o sign-in e false ao terminar', async () => {
    let resolveJsSignIn!: () => void;
    mockJsSignIn.mockReturnValue(new Promise<void>(res => { resolveJsSignIn = res; }));
    mockRnfbSignIn.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAppleSignIn());

    let signInDone = false;
    act(() => {
      result.current.signIn().then(() => { signInDone = true; });
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    resolveJsSignIn();
    await waitFor(() => expect(signInDone).toBe(true));
    expect(result.current.loading).toBe(false);
  });

  it('loading=false após sign-in bem-sucedido', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(result.current.loading).toBe(false);
  });

  it('loading=false mesmo após cancelamento do usuário', async () => {
    const cancelError = Object.assign(new Error('Cancelled'), { code: 'ERR_REQUEST_CANCELED' });
    mockAppleSignIn.mockRejectedValue(cancelError);
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(result.current.loading).toBe(false);
  });
});

describe('useAppleSignIn — tratamento de erros', () => {
  it('não exibe alerta quando usuário cancela (ERR_REQUEST_CANCELED)', async () => {
    const cancelError = Object.assign(new Error('User cancelled'), { code: 'ERR_REQUEST_CANCELED' });
    mockAppleSignIn.mockRejectedValue(cancelError);
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  it('exibe alerta quando identityToken está ausente na resposta da Apple', async () => {
    mockAppleSignIn.mockResolvedValue({ ...appleResult, identityToken: null });
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.stringContaining('token'));
    expect(mockJsSignIn).not.toHaveBeenCalled();
    expect(mockRnfbSignIn).not.toHaveBeenCalled();
  });

  it('exibe alerta para erros genéricos', async () => {
    mockJsSignIn.mockRejectedValue(new Error('Network request failed'));
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.any(String));
  });
});
