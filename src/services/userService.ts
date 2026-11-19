import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { BOOTSTRAPPED_ADMIN_EMAIL, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type { UserAddress, UserProfile } from '../types/user';

function toIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function syncUserProfileOnLogin(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const payload = {
        displayName: (user.displayName || 'GIFTLY Customer').slice(0, 100),
        email: (user.email || '').slice(0, 160),
        photoURL: (user.photoURL || '').slice(0, 500),
        phone: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload);
      return {
        uid: user.uid,
        displayName: payload.displayName,
        email: payload.email,
        photoURL: payload.photoURL,
        phone: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const data = snap.data();
    return {
      uid: user.uid,
      displayName: String(data.displayName ?? user.displayName ?? ''),
      email: String(data.email ?? user.email ?? ''),
      photoURL: String(data.photoURL ?? user.photoURL ?? ''),
      phone: String(data.phone ?? ''),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: { displayName: string; phone: string }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: updates.displayName.trim().slice(0, 100),
      phone: updates.phone.trim().slice(0, 20),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function fetchUserAddresses(uid: string): Promise<UserAddress[]> {
  const path = `users/${uid}/addresses`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'addresses'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        label: String(data.label ?? 'Home'),
        fullName: String(data.fullName ?? ''),
        phone: String(data.phone ?? ''),
        addressLine: String(data.addressLine ?? ''),
        city: String(data.city ?? ''),
        state: String(data.state ?? ''),
        pinCode: String(data.pinCode ?? ''),
        isDefault: Boolean(data.isDefault),
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addUserAddress(
  uid: string,
  address: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserAddress> {
  const addressId = `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const path = `users/${uid}/addresses/${addressId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'addresses', addressId), {
      label: address.label.trim().slice(0, 40) || 'Home',
      fullName: address.fullName.trim().slice(0, 100),
      phone: address.phone.trim().slice(0, 15),
      addressLine: address.addressLine.trim().slice(0, 250),
      city: address.city.trim().slice(0, 80),
      state: address.state.trim().slice(0, 80),
      pinCode: address.pinCode.trim(),
      isDefault: Boolean(address.isDefault),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      ...address,
      id: addressId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteUserAddress(uid: string, addressId: string): Promise<void> {
  const path = `users/${uid}/addresses/${addressId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'addresses', addressId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
