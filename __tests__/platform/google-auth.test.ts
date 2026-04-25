import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useGoogleSignIn } from '@/platform/google-auth.native';

// ── Call-order tracker ────────────────────────────────────────────────────────

const callOrder: string[] = [];

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

const mockRnfbSignIn  = jest.fn();
const mockRnfbSignOut = jest.fn();

jest.mock('@react-native-firebase/auth', () => {
  const instance = {
    signInWithCredential: (...args: unknown[]) => mockRnfbSignIn(...args),
    signOut:              (...args: unknown[]) => mockRnfbSignOut(...args),
  };
  const authFn = jest.fn(() => instance);
  (authFn as any).GoogleAuthProvider = {
    credential: jest.fn((idToken: string) => ({ type: 'google', idToken })),
  };
  return {
    __esModule: true,
    default:            authFn,
    GoogleAuthProvider: (authFn as any).GoogleAuthProvider,
  };
});

const mockJsSignIn  = jest.fn();
const mockJsSignOut = jest.fn();

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: jest.fn((idToken: string) => ({ type: 'google-js', idToken })),
  },
  signInWithCredential: (...args: unknown[]) => mockJsSignIn(...args),
  signOut:              (...args: unknown[]) => mockJsSignOut(...args),
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
  callOrder.length = 0;

  mockHasPlayServices.mockResolvedValue(true);
  mockGoogleSignInFn.mockResolvedValue(signInResult);
  mockJsSignIn.mockImplementation(async () => { callOrder.push('js-sdk'); });
  mockRnfbSignIn.mockImplementation(async () => { callOrder.push('rnfb'); });
  mockGoogleSignOut.mockResolvedValue(undefined);
  mockJsSignOut.mockResolvedValue(undefined);
  mockRnfbSignOut.mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useGoogleSignIn — ordem de autenticação (fix race condition)', () => {
  it('autentica JS SDK antes do RNFB para que Firestore esteja disponível quando onAuthStateChanged disparar', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(callOrder).toEqual(['js-sdk', 'rnfb']);
  });

  it('invocationCallOrder confirma: jsSignInWithCredential < auth().signInWithCredential', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignIn).toHaveBeenCalledTimes(1);
    expect(mockRnfbSignIn).toHaveBeenCalledTimes(1);
    expect(mockJsSignIn.mock.invocationCallOrder[0])
      .toBeLessThan(mockRnfbSignIn.mock.invocationCallOrder[0]);
  });

  it('ambos os SDKs são chamados em um sign-in bem-sucedido', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignIn).toHaveBeenCalledTimes(1);
    expect(mockRnfbSignIn).toHaveBeenCalledTimes(1);
  });
});

describe('useGoogleSignIn — rollback quando RNFB falha', () => {
  beforeEach(() => {
    mockRnfbSignIn.mockRejectedValue(new Error('RNFB credential error'));
  });

  it('faz signOut no JS SDK para reverter a sessão', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignOut).toHaveBeenCalledTimes(1);
  });

  it('faz signOut no Google Sign-In para reverter a sessão', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockGoogleSignOut).toHaveBeenCalledTimes(1);
  });

  it('exibe alerta de erro ao usuário', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.any(String));
  });
});

describe('useGoogleSignIn — JS SDK falha antes do RNFB', () => {
  beforeEach(() => {
    mockJsSignIn.mockRejectedValue(new Error('JS SDK network error'));
  });

  it('não chama RNFB quando JS SDK falha', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockRnfbSignIn).not.toHaveBeenCalled();
  });

  it('não faz rollback (RNFB nunca foi chamado)', async () => {
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockJsSignOut).not.toHaveBeenCalled();
    expect(mockRnfbSignOut).not.toHaveBeenCalled();
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
    mockRnfbSignIn.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGoogleSignIn());

    // Start sign-in without awaiting so we can inspect intermediate state
    let signInDone = false;
    act(() => {
      result.current.signIn().then(() => { signInDone = true; });
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    // Unblock JS SDK and complete sign-in
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
    expect(mockRnfbSignIn).not.toHaveBeenCalled();
  });

  it('exibe alerta para erros genéricos de rede', async () => {
    mockJsSignIn.mockRejectedValue(new Error('Network request failed'));
    const { result } = renderHook(() => useGoogleSignIn());

    await act(async () => { await result.current.signIn(); });

    expect(mockShowAlert).toHaveBeenCalledWith('Erro', expect.any(String));
  });
});
