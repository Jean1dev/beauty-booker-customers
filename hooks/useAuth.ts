import { signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

import { ensureCustomerDoc } from '@/services/customers';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const setUser    = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const user       = useAuthStore((s) => s.user);
  const profile    = useAuthStore((s) => s.profile);
  const loading    = useAuthStore((s) => s.loading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const customerProfile = await ensureCustomerDoc(firebaseUser);
        setProfile(customerProfile);
      } else {
        setProfile(null);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setProfile, setLoading]);

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return { user, profile, loading, signOut };
}
