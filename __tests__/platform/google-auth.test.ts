import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useGoogleSignIn } from '@/platform/google-auth.native';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockHasPlayServices = jest.fn();
const mockGoogleSignInFn  = jest.fn();
const mockGoogleSignOut   = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure:       jest.fn(),
    hasPlayServices: (...args: unknown[]) => mockHasPlayServices(...args),
    signIn:          (...args: unknown[]) => mockGoogleSignInFn(...args),
    signOut:         (...args: unknown[]) => mockGoogleSignOut(...args),
  },
  isErrorWithCode: (err: unknown): err is { code: string } =>
    typeof err === 'object' && err !== null && 'code' in err,
  statusCodes: {
    SIGN_IN_CANCELLED:           'SIGN_IN_CANCELLED',
    IN_PROGRESS:                 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

const mockJsSignIn  = jest.fn();

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: jest.fn((idToken: string) => ({ type: 'google-js', idToken })),
  },
  signInWithCredential: (...args: unknown[]) => mockJsSignIn(...args),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { googleWebClientId: 'test-web-client-id' } } },
}));

jest.mock('@/services/firebase', () => ({ auth: {}, db: {}, storage: {} }));

const mockShowAlert = jest.fn();
jest.mock('@/platform/alert', () => ({
  showAlert: (...args: unknown[]) => mockShowAlert(...args),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const idToken      = 'google-id-token-abc';
const signInResult = { data: { idToken } };

function makeGoogleError(code: string) {
  return Object.assign(new Error(`Google error: ${code}`), { code });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  mockHasPlayServices.mockResolvedValue(true);
  mockGoogleSignInFn.mockResolvedValue(signInResult);
  mockJsSignIn.mockResolvedValue(undefined);
  mockGoogleSignOut.mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useGoogleSignIn — autenticação via JS SDK', () => {
  it('chama jsSignInWithCredential uma única vez em sign-in bem-sucedido', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignIn).toHaveBeenCalledTimes(1);
  });

  it('passa o idToken correto para o JS SDK', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignIn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ type: 'google-js', idToken }),
    );
  });
});

describe('useGoogleSignIn — estado de loading', () => {
  it('começa com loading=false', () => {
    const { result } = renderHook(() => useGoogleSignIn());
    expect(result.current.loading).toBe(false);
  });

  it('loading=true durante o sign-in e false ao terminar', async () => {
    let resolveJsSignIn!: () => void;
    mockJsSignIn.mockReturnValue(new Promise<void>(res => { resolveJsSignIn = res; }));

    const { result } = renderHook(() => useGoogleSignIn());

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
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(result.current.loading).toBe(false);
  });

  it('loading=false mesmo quando sign-in falha', async () => {
    mockGoogleSignInFn.mockRejectedValue(makeGoogleError('SIGN_IN_CANCELLED'));
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(result.current.loading).toBe(false);
  });
});

describe('useGoogleSignIn — tratamento de erros', () => {
  it('não exibe alerta quando usuário cancela (SIGN_IN_CANCELLED)', async () => {
    mockGoogleSignInFn.mockRejectedValue(makeGoogleError('SIGN_IN_CANCELLED'));
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  it('não exibe alerta quando sign-in já está em andamento (IN_PROGRESS)', async () => {
    mockGoogleSignInFn.mockRejectedValue(makeGoogleError('IN_PROGRESS'));
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  it('exibe alerta quando Google Play Services não está disponível', async () => {
    mockGoogleSignInFn.mockRejectedValue(makeGoogleError('PLAY_SERVICES_NOT_AVAILABLE'));
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith(
      'Erro',
      expect.stringContaining('Play Services'),
    );
  });

  it('exibe alerta quando idToken está ausente na resposta do Google', async () => {
    mockGoogleSignInFn.mockResolvedValue({ data: { idToken: null } });
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.stringContaining('token'));
    expect(mockJsSignIn).not.toHaveBeenCalled();
  });

  it('exibe alerta para erros genéricos de rede', async () => {
    mockJsSignIn.mockRejectedValue(new Error('Network request failed'));
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.any(String));
  });
});
