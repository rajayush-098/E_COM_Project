import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';

const GUEST_WISHLIST_KEY = 'giftly_guest_wishlist_v1';

export function loadGuestWishlist(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveGuestWishlist(productIds: string[]): void {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(productIds.slice(0, 100)));
  } catch {
    // Ignore storage errors
  }
}

export async function fetchUserWishlist(uid: string): Promise<string[]> {
  const path = `wishlists/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'wishlists', uid));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.productIds)
      ? data.productIds.filter((id: unknown) => typeof id === 'string')
      : [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserWishlist(uid: string, productIds: string[]): Promise<void> {
  const path = `wishlists/${uid}`;
  const uniqueIds = Array.from(new Set(productIds)).slice(0, 100);
  try {
    await setDoc(doc(db, 'wishlists', uid), {
      userId: uid,
      productIds: uniqueIds,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
