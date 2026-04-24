import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import type { CustomerFavorite, Professional } from '@/types/professional';

const PREFS_COLLECTION      = 'user-preferences';
const FAVORITES_COLLECTION  = 'customer_favorites';

export function subscribeProfessionals(
  onUpdate: (pros: Professional[]) => void,
): () => void {
  const q = query(collection(db, PREFS_COLLECTION));
  return onSnapshot(q, (snap) => {
    const pros = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Professional))
      .filter((p) => p.isPublicProfile !== false);
    onUpdate(pros);
  });
}

export function subscribeFavorites(
  uid: string,
  onUpdate: (links: Set<string>) => void,
): () => void {
  const q = query(
    collection(db, FAVORITES_COLLECTION),
    where('customerId', '==', uid),
  );
  return onSnapshot(q, (snap) => {
    onUpdate(new Set(snap.docs.map((d) => d.data().userLink as string)));
  });
}

export async function toggleFavorite(
  uid: string,
  userLink: string,
  isFav: boolean,
): Promise<void> {
  const ref = doc(db, FAVORITES_COLLECTION, `${uid}_${userLink}`);
  if (isFav) {
    await deleteDoc(ref);
  } else {
    const fav: CustomerFavorite = { customerId: uid, userLink, createdAt: Date.now() };
    await setDoc(ref, fav);
  }
}
