import { useEffect } from 'react';

import { deleteAccount as platformDeleteAccount, signOut as platformSignOut, subscribeAuth } from '@/platform/auth';
import { deleteCustomerData, ensureCustomerDoc } from '@/services/customers';
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
      setUser(authUser);

      if (!authUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const customerProfile = await ensureCustomerDoc(authUser);
        setProfile(customerProfile);
      } catch (error) {
        console.warn('[useAuth] ensureCustomerDoc failed', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [setUser, setProfile, setLoading]);

  async function signOut() {
    await platformSignOut();
  }

  async function deleteAccount() {
    if (!user) return;
    await deleteCustomerData(user.uid);
    await platformDeleteAccount();
  }

  return { user, profile, loading, signOut, deleteAccount };
}
