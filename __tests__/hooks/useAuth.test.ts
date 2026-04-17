import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import type { AuthUser } from '@/platform/auth';
import type { CustomerProfile } from '@/types/customer';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSubscribeAuth = jest.fn();
const mockSignOut       = jest.fn();
const mockEnsureDoc     = jest.fn();

jest.mock('@/platform/auth', () => ({
  subscribeAuth: (...args: unknown[]) => mockSubscribeAuth(...args),
  signOut:       () => mockSignOut(),
}));

jest.mock('@/services/customers', () => ({
  ensureCustomerDoc: (...args: unknown[]) => mockEnsureDoc(...args),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser: AuthUser = {
  uid:         'user-abc',
  email:       'ana@example.com',
  displayName: 'Ana Lima',
  photoURL:    null,
};

const mockProfile: CustomerProfile = {
  uid:       'user-abc',
  name:      'Ana Lima',
  email:     'ana@example.com',
  photoUrl:  '',
  phone:     '11999887766',
  createdAt: 1700000000000,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, profile: null, loading: true });
  // por padrão subscribeAuth retorna um unsubscribe sem-op
  mockSubscribeAuth.mockReturnValue(jest.fn());
});

describe('useAuth — estado inicial', () => {
  it('registra listener no subscribeAuth ao montar', () => {
    renderHook(() => useAuth());
    expect(mockSubscribeAuth).toHaveBeenCalledTimes(1);
  });

  it('retorna loading=true antes do Firebase responder', () => {
    // subscribeAuth não chama o callback
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });
});

describe('useAuth — login bem-sucedido', () => {
  it('atualiza user e profile quando Firebase autentica', async () => {
    mockSubscribeAuth.mockImplementation((cb: Function) => {
      cb(mockUser);
      return jest.fn();
    });
    mockEnsureDoc.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.profile).toEqual(mockProfile);
  });

  it('chama ensureCustomerDoc com o authUser correto', async () => {
    mockSubscribeAuth.mockImplementation((cb: Function) => {
      cb(mockUser);
      return jest.fn();
    });
    mockEnsureDoc.mockResolvedValue(mockProfile);

    renderHook(() => useAuth());

    await waitFor(() => expect(mockEnsureDoc).toHaveBeenCalledWith(mockUser));
  });

  it('define loading=false após obter profile', async () => {
    mockSubscribeAuth.mockImplementation((cb: Function) => {
      cb(mockUser);
      return jest.fn();
    });
    mockEnsureDoc.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('useAuth — logout (user null)', () => {
  it('limpa user e profile quando Firebase desautentica', async () => {
    // começa autenticado
    useAuthStore.setState({ user: mockUser, profile: mockProfile, loading: false });

    mockSubscribeAuth.mockImplementation((cb: Function) => {
      cb(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('não chama ensureCustomerDoc quando user é null', async () => {
    mockSubscribeAuth.mockImplementation((cb: Function) => {
      cb(null);
      return jest.fn();
    });

    renderHook(() => useAuth());

    await waitFor(() =>
      expect(useAuthStore.getState().loading).toBe(false),
    );

    expect(mockEnsureDoc).not.toHaveBeenCalled();
  });
});

describe('useAuth — erro no ensureCustomerDoc', () => {
  it('define profile=null e loading=false quando ensureDoc falha', async () => {
    mockSubscribeAuth.mockImplementation((cb: Function) => {
      cb(mockUser);
      return jest.fn();
    });
    mockEnsureDoc.mockRejectedValue(new Error('Firestore offline'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile).toBeNull();
    expect(result.current.user).toEqual(mockUser);
  });
});

describe('useAuth — signOut', () => {
  it('chama platformSignOut ao invocar signOut()', async () => {
    mockSignOut.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('useAuth — cleanup', () => {
  it('chama unsubscribe ao desmontar o hook', () => {
    const unsubscribe = jest.fn();
    mockSubscribeAuth.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAuth());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
