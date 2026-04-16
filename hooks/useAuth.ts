import { useEffect } from 'react';

import { signOut as platformSignOut, subscribeAuth } from '@/platform/auth';
import { ensureCustomerDoc } from '@/services/customers';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const setUser    = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const user       = useAuthStore((s) => s.user);
  const profile    = useAuthStore((s) => s.profile);
  const loading    = useAuthStore((s) => s.loading);

  useEffect(() => {
    const unsubscribe = subscribeAuth(async (authUser) => {
      if (authUser) {
        const customerProfile = await ensureCustomerDoc(authUser);
        setProfile(customerProfile);
      } else {
        setProfile(null);
      }
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setProfile, setLoading]);

  async function signOut() {
    await platformSignOut();
  }

  return { user, profile, loading, signOut };
}
