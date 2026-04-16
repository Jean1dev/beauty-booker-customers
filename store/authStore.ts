import { create } from 'zustand';

import type { AuthUser } from '@/platform/auth';
import { CustomerProfile } from '@/types/customer';

interface AuthState {
  user:       AuthUser | null;
  profile:    CustomerProfile | null;
  loading:    boolean;
  setUser:    (user: AuthUser | null) => void;
  setProfile: (profile: CustomerProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:       null,
  profile:    null,
  loading:    true,
  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));
