import { useEffect, useState } from 'react';

import {
  subscribeFavorites,
  subscribeProfessionals,
  toggleFavorite as toggleFavoriteService,
} from '@/services/professionals';
import { useAuthStore } from '@/store/authStore';
import type { Professional } from '@/types/professional';

export function useProfessionals() {
  const user = useAuthStore((s) => s.user);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeProfessionals((pros) => {
      setProfessionals(pros);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeFavorites(user.uid, setFavorites);
    return unsub;
  }, [user?.uid]);

  const toggleFavorite = async (userLink: string) => {
    if (!user) return;
    await toggleFavoriteService(user.uid, userLink, favorites.has(userLink));
  };

  return { professionals, favorites, loading, toggleFavorite };
}
