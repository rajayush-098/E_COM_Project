# GIFTLY — Administrator Setup Guide

GIFTLY enforces strict Role-Based Access Control (RBAC) for its Admin Dashboard and catalog management operations. Ordinary customers can never elevate themselves to administrators by editing their own user profile.

## How Admin Authorization Works

Admin access is checked through two secure mechanisms enforced in `firestore.rules`:

1. **Bootstrapped Store Owner**: The primary store owner account (`sunnyayush2570@gmail.com` with verified Google Sign-In) is authorized as the initial super-administrator so you can immediately sign in, initialize the Firestore product catalogue, and manage the store.
2. **Protected `admins` Collection**: Additional administrators are stored in `/admins/{uid}` documents with the schema:
   ```json
   {
     "uid": "<firebase-auth-uid>",
     "email": "manager@example.com",
     "role": "admin",
     "createdAt": "<Firestore Server Timestamp>"
   }
   ```

## Assigning Your First or Additional Administrators via Firebase Console

1. Open the [Firebase Console](https://console.firebase.google.com/) and select your project (`algebraic-gearbox-zcjpc`).
2. Navigate to **Authentication → Users** and have the administrator sign in once with Google Sign-In.
3. Copy their **User UID** from the Authentication table.
4. Navigate to **Firestore Database** and select the database `ai-studio-2c19b1e3-68dc-47d3-b8f0-6d03bbebe5ef`.
5. Click **Start collection** (or open the `admins` collection):
   - **Collection ID**: `admins`
   - **Document ID**: Paste the exact Firebase Auth **User UID**
   - **Fields**:
     - `uid` (`string`): same Firebase Auth UID
     - `email` (`string`): administrator's verified Google email
     - `role` (`string`): `admin` or `super_admin`
     - `createdAt` (`timestamp`): current date/time
6. Save the document. The user now has immediate access to `/admin` when signed in.

## Security Guarantees

- Customers cannot create, edit, or delete documents in `/admins/{uid}`.
- Customers cannot add `role` or `isAdmin` fields to `/users/{uid}` (strict `hasOnly()` allowlist enforced in `firestore.rules`).
- All catalog writes (`products`, `categories`) and order status updates require verified administrator credentials.
- Review and harden `firestore.rules` in the Firebase Console before launching publicly at scale.
