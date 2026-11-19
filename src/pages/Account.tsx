import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  LogOut,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { fetchUserOrders } from '../services/orderService';
import {
  addUserAddress,
  deleteUserAddress,
  fetchUserAddresses,
  updateUserProfile,
} from '../services/userService';
import type { Order } from '../types/order';
import type { UserAddress } from '../types/user';
import { formatDateIN, formatINR } from '../utils/formatCurrency';
import { INDIAN_STATES, PIN_CODE_REGEX } from '../utils/validation';

export function Account() {
  const { user, profile, isAdmin, authLoading, logout, refreshProfile } = useAuth();
  const { showToast } = useStore();

  const [tab, setTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // New Address state
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: 'Karnataka',
    pinCode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);
    Promise.all([fetchUserOrders(user.uid), fetchUserAddresses(user.uid)])
      .then(([ord, addrs]) => {
        setOrders(ord);
        setAddresses(addrs);
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [user]);

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-sm text-[#777F7B]">
        Loading your account...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/account' }} replace />;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUserProfile(user.uid, { displayName, phone });
      await refreshProfile();
      showToast('Profile updated successfully.', 'success');
    } catch {
      showToast('Could not update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PIN_CODE_REGEX.test(newAddr.pinCode.trim())) {
      showToast('Enter a valid 6-digit Indian PIN code.', 'error');
      return;
    }
    try {
      const created = await addUserAddress(user.uid, newAddr);
      setAddresses((prev) => [...prev, created]);
      setAddingAddress(false);
      setNewAddr({
        label: 'Home',
        fullName: '',
        phone: '',
        addressLine: '',
        city: '',
        state: 'Karnataka',
        pinCode: '',
        isDefault: false,
      });
      showToast('Delivery address saved.', 'success');
    } catch {
      showToast('Could not save address.', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteUserAddress(user.uid, id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast('Address removed.', 'info');
    } catch {
      showToast('Could not delete address.', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Account Header */}
      <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border border-[#E8ECE8]"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#EEF2EC] flex items-center justify-center text-[#26734D]">
              <UserIcon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-[#202A27]">
              {profile?.displayName || user.displayName || 'GIFTLY Member'}
            </h1>
            <p className="text-sm text-[#777F7B]">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#26734D] text-white text-xs font-semibold hover:bg-[#1E5C3D] transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E8ECE8] text-xs font-semibold text-[#202A27] hover:bg-[#F8F9F7] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="inline-flex items-center gap-1 p-1 bg-[#EEF2EC] rounded-xl mb-8">
        {[
          { id: 'orders', label: `Order History (${orders.length})`, icon: Package },
          { id: 'addresses', label: `Saved Addresses (${addresses.length})`, icon: MapPin },
          { id: 'profile', label: 'Profile Settings', icon: UserIcon },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-white text-[#202A27] shadow-sm'
                  : 'text-[#777F7B] hover:text-[#202A27]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <p className="text-sm text-[#777F7B]">Loading your order history...</p>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-[#E8ECE8] rounded-2xl p-10 text-center space-y-3">
              <p className="font-display font-bold text-[#202A27]">No orders yet</p>
              <p className="text-sm text-[#777F7B]">
                Orders you place while signed in appear here with live status tracking.
              </p>
              <Link
                to="/shop"
                className="inline-block mt-2 px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-sm font-medium"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white border border-[#E8ECE8] rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8ECE8] text-sm">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-mono-num font-bold text-[#202A27]">{order.orderId}</span>
                    <span className="text-xs text-[#777F7B]">{formatDateIN(order.createdAt)}</span>
                    <span className="text-xs font-semibold text-[#26734D]">
                      Status: {order.orderStatus}
                    </span>
                  </div>
                  <span className="font-mono-num font-bold text-base text-[#202A27]">
                    {formatINR(order.total)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex justify-between gap-4">
                      <span className="text-[#202A27] truncate">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-mono-num text-[#777F7B] shrink-0">
                        {formatINR(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#E8ECE8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#777F7B]">
                  <span>
                    {order.paymentMethod} · {order.paymentStatus}
                  </span>
                  <span>
                    Delivering to {order.deliveryAddress.city}, {order.deliveryAddress.pinCode}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADDRESSES TAB */}
      {tab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#202A27]">Saved Addresses</h2>
            <button
              type="button"
              onClick={() => setAddingAddress((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#26734D] text-white text-xs font-semibold hover:bg-[#1E5C3D] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </button>
          </div>

          {addingAddress && (
            <form
              onSubmit={handleAddAddress}
              className="bg-white border border-[#E8ECE8] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <input
                type="text"
                required
                placeholder="Label (e.g. Home, Office)"
                value={newAddr.label}
                onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                className="px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Recipient Full Name"
                value={newAddr.fullName}
                onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                className="px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
              />
              <input
                type="tel"
                required
                placeholder="10-digit Mobile Number"
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                className="px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
              />
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit PIN Code"
                value={newAddr.pinCode}
                onChange={(e) =>
                  setNewAddr({ ...newAddr, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                }
                className="px-3.5 py-2.5 text-sm font-mono-num bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Complete Street Address"
                value={newAddr.addressLine}
                onChange={(e) => setNewAddr({ ...newAddr, addressLine: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="City"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
              />
              <select
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                className="px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="sm:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-xs font-semibold cursor-pointer"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setAddingAddress(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#E8ECE8] text-xs font-semibold text-[#777F7B] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white border border-[#E8ECE8] rounded-2xl p-5 flex items-start justify-between gap-4"
              >
                <div className="text-sm space-y-1">
                  <p className="font-display font-bold text-[#202A27]">{addr.label}</p>
                  <p className="text-[#202A27]">{addr.fullName}</p>
                  <p className="text-xs text-[#777F7B] leading-relaxed">
                    {addr.addressLine}, {addr.city}, {addr.state} – {addr.pinCode}
                  </p>
                  <p className="text-xs font-mono-num text-[#777F7B]">{addr.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteAddress(addr.id)}
                  aria-label="Delete address"
                  className="p-2 text-[#777F7B] hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-lg bg-white border border-[#E8ECE8] rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-[#202A27]">Personal Information</h2>
          <div>
            <label className="block text-xs font-semibold text-[#202A27] mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#202A27] mb-1.5">Email</label>
            <input
              type="email"
              disabled
              value={user.email || ''}
              className="w-full px-3.5 py-2.5 text-sm bg-[#EEF2EC] border border-[#E8ECE8] rounded-xl text-[#777F7B]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#202A27] mb-1.5">
              Mobile Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] disabled:opacity-60 cursor-pointer"
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
}
