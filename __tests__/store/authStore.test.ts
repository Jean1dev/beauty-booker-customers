import { useAuthStore } from '@/store/authStore';

import type { AuthUser } from '@/platform/auth';
import type { CustomerProfile } from '@/types/customer';

const mockUser: AuthUser = {
  uid:         'user-123',
  email:       'ana@example.com',
  displayName: 'Ana Lima',
  photoURL:    null,
};

const mockProfile: CustomerProfile = {
  uid:       'user-123',
  name:      'Ana Lima',
  email:     'ana@example.com',
  photoUrl:  '',
  phone:     '11999887766',
  createdAt: 1700000000000,
};

beforeEach(() => {
  useAuthStore.setState({ user: null, profile: null, loading: true });
});

describe('authStore — estado inicial', () => {
  it('começa com user nulo', () => {
    useAuthStore.setState({ user: null, profile: null, loading: true });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('começa com profile nulo', () => {
    useAuthStore.setState({ user: null, profile: null, loading: true });
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('começa com loading true', () => {
    useAuthStore.setState({ user: null, profile: null, loading: true });
    expect(useAuthStore.getState().loading).toBe(true);
  });
});

describe('authStore — setUser', () => {
  it('atualiza user com objeto válido', () => {
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('aceita null (logout)', () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('não afeta profile ao mudar user', () => {
    useAuthStore.setState({ profile: mockProfile });
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().profile).toEqual(mockProfile);
  });
});

describe('authStore — setProfile', () => {
  it('atualiza profile com objeto válido', () => {
    useAuthStore.getState().setProfile(mockProfile);
    expect(useAuthStore.getState().profile).toEqual(mockProfile);
  });

  it('aceita null (perfil removido)', () => {
    useAuthStore.setState({ profile: mockProfile });
    useAuthStore.getState().setProfile(null);
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('preserva user ao mudar profile', () => {
    useAuthStore.setState({ user: mockUser });
    useAuthStore.getState().setProfile(mockProfile);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });
});

describe('authStore — setLoading', () => {
  it('muda para false', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('muda para true', () => {
    useAuthStore.setState({ loading: false });
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().loading).toBe(true);
  });

  it('não afeta user nem profile', () => {
    useAuthStore.setState({ user: mockUser, profile: mockProfile });
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().profile).toEqual(mockProfile);
  });
});
