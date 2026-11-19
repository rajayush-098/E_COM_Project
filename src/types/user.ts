export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRecord {
  uid: string;
  email?: string;
  role: 'admin' | 'super_admin';
  createdAt?: string;
}
