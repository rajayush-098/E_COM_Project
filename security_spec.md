# GIFTLY Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Catalog Integrity**: Public visitors may only read active products (`isActive == true`) and active categories (`isActive == true`). Only verified administrators may create, edit, or delete catalog items or categories.
2. **Inventory Protection**: Non-admin updates to `products/{productId}` are strictly limited to atomic order stock decrements (`affectedKeys().hasOnly(['stockQuantity', 'updatedAt'])`, `stockQuantity >= 0`, `stockQuantity < existing().stockQuantity`, decrement `<= 20`, `updatedAt == request.time`).
3. **PII Isolation**: `users/{userId}` and `users/{userId}/addresses/{addressId}` contain emails, phone numbers, and street addresses; read and write access is strictly limited to `isOwner(userId)` or `isAdmin()`.
4. **No Self-Privilege Escalation**: `users/{userId}` forbids any `role` or `isAdmin` fields via strict `hasOnly()` allowlists. `admins/{adminUid}` can only be written by the bootstrapped admin (`sunnyayush2570@gmail.com` with `email_verified == true`).
5. **Order Financial Integrity**: Customers and guests may only create orders with initial `orderStatus == 'Pending'`, valid non-negative numeric totals, bounded items (`1..30`), and `createdAt == request.time`. Customers cannot modify order totals, payment statuses, or order statuses after creation.
6. **Terminal Order Locking**: Once an order reaches `Delivered` or `Cancelled`, non-admin modifications remain impossible and admin transitions are audited.
7. **Review Relational Sync**: Reviews require a verified signed-in user, `userId == request.auth.uid`, valid 1–5 integer rating, and `exists()` verification that `productId` exists in `/products/`.

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Target Collection | Attack Vector | Expected Result |
|---|---|---|---|
| 1 | `/users/{uid}` | Shadow field `role: "admin"` injected on profile create | `PERMISSION_DENIED` |
| 2 | `/admins/{uid}` | Ordinary signed-in customer creates `/admins/{ownUid}` | `PERMISSION_DENIED` |
| 3 | `/users/{otherUid}` | Signed-in user reads another user's profile PII | `PERMISSION_DENIED` |
| 4 | `/products/{id}` | Non-admin user modifies `price` to `1` | `PERMISSION_DENIED` |
| 5 | `/products/{id}` | Non-admin increments `stockQuantity` instead of decrementing | `PERMISSION_DENIED` |
| 6 | `/products/{hugeId}` | 200-char junk document ID resource poisoning | `PERMISSION_DENIED` |
| 7 | `/orders/{id}` | Customer creates order with `orderStatus: "Delivered"` | `PERMISSION_DENIED` |
| 8 | `/orders/{id}` | Customer updates own order `total: 0` or `paymentStatus: "Paid (Demo)"` | `PERMISSION_DENIED` |
| 9 | `/orders` (list) | Customer queries orders without `where('userId', '==', uid)` | `PERMISSION_DENIED` |
| 10 | `/carts/{otherUid}` | Customer reads or writes another user's cart | `PERMISSION_DENIED` |
| 11 | `/reviews/{id}` | User creates review spoofing `userId: "someone_else"` | `PERMISSION_DENIED` |
| 12 | `/categories/{id}` | Spoofed admin email with `email_verified: false` edits category | `PERMISSION_DENIED` |
