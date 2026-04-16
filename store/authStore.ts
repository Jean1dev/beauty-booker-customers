import { User } from 'firebase/auth';
import { create } from 'zustand';

import { CustomerProfile } from '@/types/customer';

interface AuthState {
  user:       User | null;
  profile:    CustomerProfile | null;
  loading:    boolean;
  setUser:    (user: User | null) => void;
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
