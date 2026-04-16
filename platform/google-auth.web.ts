import { browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useState } from 'react';

import { auth } from '@/services/firebase';

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      // onAuthStateChanged em useAuth atualiza o store → _layout redireciona
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading };
}
