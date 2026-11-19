/**
 * GIFTLY Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies all 12 adversarial payloads against the Eight Pillars of Hardened Rules.
 * Run with Firebase Emulator Suite & @firebase/rules-unit-testing when emulators are available.
 */

export interface AdversarialPayloadCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actor: 'guest' | 'customerA' | 'customerB' | 'unverifiedAdmin' | 'admin';
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_CASES: AdversarialPayloadCase[] = [
  {
    id: 1,
    name: 'Shadow role injection on user profile create',
    collectionPath: 'users/customerA',
    operation: 'create',
    actor: 'customerA',
    payload: {
      displayName: 'Mallory',
      email: 'mallory@example.com',
      role: 'admin',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Self-elevation in admins collection',
    collectionPath: 'admins/customerA',
    operation: 'create',
    actor: 'customerA',
    payload: { uid: 'customerA', role: 'super_admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-user PII read on users profile',
    collectionPath: 'users/customerB',
    operation: 'get',
    actor: 'customerA',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Non-admin price tampering on product',
    collectionPath: 'products/prod-earbuds-01',
    operation: 'update',
    actor: 'customerA',
    payload: { price: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Non-admin stock inflation on product',
    collectionPath: 'products/prod-earbuds-01',
    operation: 'update',
    actor: 'customerA',
    payload: { stockQuantity: 9999 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Oversized document ID poisoning (>128 chars)',
    collectionPath: `products/${'a'.repeat(160)}`,
    operation: 'get',
    actor: 'guest',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Order state shortcutting on create (Delivered)',
    collectionPath: 'orders/ORD-FAKE-01',
    operation: 'create',
    actor: 'customerA',
    payload: { orderStatus: 'Delivered', userId: 'customerA' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Customer modifying order total after placement',
    collectionPath: 'orders/ORD-REAL-01',
    operation: 'update',
    actor: 'customerA',
    payload: { total: 0, paymentStatus: 'Paid (Demo)' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unscoped list query across all customer orders',
    collectionPath: 'orders',
    operation: 'list',
    actor: 'customerA',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Cross-user cart access',
    collectionPath: 'carts/customerB',
    operation: 'get',
    actor: 'customerA',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Review author UID spoofing',
    collectionPath: 'reviews/rev-spoof-1',
    operation: 'create',
    actor: 'customerA',
    payload: {
      productId: 'prod-earbuds-01',
      userId: 'customerB',
      userName: 'Spoofed',
      rating: 5,
      reviewText: 'Great product!',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unverified admin email spoofing on category write',
    collectionPath: 'categories/electronics',
    operation: 'update',
    actor: 'unverifiedAdmin',
    payload: { name: 'Hacked Electronics' },
    expected: 'PERMISSION_DENIED',
  },
];
