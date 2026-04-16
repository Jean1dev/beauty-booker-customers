import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import type { AuthUser } from '@/platform/auth';
import { db } from '@/services/firebase';
import { CustomerProfile } from '@/types/customer';

const COLLECTION = 'customers';

export async function ensureCustomerDoc(user: AuthUser): Promise<CustomerProfile> {
  const ref = doc(db, COLLECTION, user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as CustomerProfile;
  }

  const profile: CustomerProfile = {
    uid:       user.uid,
    name:      user.displayName ?? '',
    email:     user.email ?? '',
    photoUrl:  user.photoURL ?? '',
    phone:     null,
    createdAt: Date.now(),
  };

  await setDoc(ref, profile);
  return profile;
}

export async function updateCustomerPhone(
  uid: string,
  phone: string,
): Promise<CustomerProfile> {
  const ref = doc(db, COLLECTION, uid);
  await updateDoc(ref, { phone });
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Customer document missing after phone update');
  }
  return snap.data() as CustomerProfile;
}
