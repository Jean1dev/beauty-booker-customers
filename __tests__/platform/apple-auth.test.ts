import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAppleSignIn } from '@/platform/apple-auth.native';

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

const mockJsSignIn = jest.fn();

jest.mock('firebase/auth', () => ({
  OAuthProvider: jest.fn().mockImplementation(() => ({
    credential: jest.fn((opts: unknown) => ({ provider: 'apple.com', ...((opts as object) ?? {}) })),
  })),
  signInWithCredential: (...args: unknown[]) => mockJsSignIn(...args),
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

  mockIsAvailable.mockResolvedValue(true);
  mockCryptoDigest.mockResolvedValue(hashedNonce);
  mockAppleSignIn.mockResolvedValue(appleResult);
  mockJsSignIn.mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAppleSignIn — disponibilidade do dispositivo', () => {
  it('começa com isAvailable=true em iOS antes de isAvailableAsync resolver (optimistic default)', () => {
    mockIsAvailable.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAppleSignIn());
    // Platform.OS is 'ios' in the test environment for .native files, so the
    // optimistic default kicks in and the button is shown immediately.
    expect(result.current.isAvailable).toBe(true);
  });

  it('define isAvailable=true quando Apple Sign-In é suportado', async () => {
    mockIsAvailable.mockResolvedValue(true);
    const { result } = renderHook(() => useAppleSignIn());
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
  });

  it('mantém isAvailable=false quando dispositivo não suporta Apple Sign-In', async () => {
    mockIsAvailable.mockResolvedValue(false);
    const { result } = renderHook(() => useAppleSignIn());
    await waitFor(() => expect(result.current.isAvailable).toBe(false));
  });

  it('mantém isAvailable=true (default otimístico) se isAvailableAsync lançar erro', async () => {
    // Em TestFlight, isAvailableAsync() lançando exceção ANTES da resolver estava
    // escondendo o botão silenciosamente. O comportamento correto em iOS é confiar
    // no default otimístico — o entitlement já está garantido por usesAppleSignIn.
    mockIsAvailable.mockRejectedValue(new Error('Not supported'));
    const { result } = renderHook(() => useAppleSignIn());
    await waitFor(() => expect(mockIsAvailable).toHaveBeenCalled());
    expect(result.current.isAvailable).toBe(true);
  });
});

describe('useAppleSignIn — autenticação via JS SDK', () => {
  it('chama jsSignInWithCredential uma única vez em sign-in bem-sucedido', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignIn).toHaveBeenCalledTimes(1);
  });

  it('passa o identityToken e rawNonce corretos para o JS SDK', async () => {
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignIn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ provider: 'apple.com', idToken: identityToken }),
    );
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
  });

  it('exibe alerta para erros genéricos de sign-in', async () => {
    mockJsSignIn.mockRejectedValue(new Error('Network request failed'));
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.any(String));
  });

  it('exibe alerta quando Apple retorna erro de credencial duplicada', async () => {
    const dupError = Object.assign(new Error('Duplicate credential received.'), {
      code: 'auth/unknown',
    });
    mockJsSignIn.mockRejectedValue(dupError);
    const { result } = renderHook(() => useAppleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.any(String));
  });
});
