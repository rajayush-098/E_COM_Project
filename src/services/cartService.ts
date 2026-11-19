import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type { CartItem } from '../types/order';

const GUEST_CART_KEY = 'giftly_guest_cart_v1';

export function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.productId === 'string' && Number(item.quantity) > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: Math.min(20, Math.max(1, Math.floor(Number(item.quantity)))),
      }));
  } catch {
    return [];
  }
}

export function saveGuestCart(items: CartItem[]): void {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearGuestCart(): void {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Ignore
  }
}

export async function fetchUserCart(uid: string): Promise<CartItem[]> {
  const path = `carts/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'carts', uid));
    if (!snap.exists()) return [];
    const data = snap.data();
    if (!Array.isArray(data.items)) return [];
    return data.items
      .filter((i: unknown) => i && typeof (i as CartItem).productId === 'string')
      .map((i: CartItem) => ({
        productId: i.productId,
        quantity: Math.min(20, Math.max(1, Math.floor(Number(i.quantity)))),
      }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserCart(uid: string, items: CartItem[]): Promise<void> {
  const path = `carts/${uid}`;
  const sanitized = items.slice(0, 50).map((i) => ({
    productId: i.productId.slice(0, 128),
    quantity: Math.min(20, Math.max(1, Math.floor(i.quantity))),
  }));
  try {
    await setDoc(doc(db, 'carts', uid), {
      userId: uid,
      items: sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
