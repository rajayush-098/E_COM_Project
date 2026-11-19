import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Truck } from 'lucide-react';
import { EmptyState } from '../components/common/Feedback';
import { SafeImage } from '../components/common/SafeImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { placeOrderSecurely } from '../services/orderService';
import { fetchUserAddresses } from '../services/userService';
import type { CustomerDetails, DeliveryAddress, PaymentMethod } from '../types/order';
import type { UserAddress } from '../types/user';
import { formatINR } from '../utils/formatCurrency';
import {
  INDIAN_STATES,
  validateCheckoutForm,
  type CheckoutFormErrors,
} from '../utils/validation';

export function Checkout() {
  const navigate = useNavigate();
  const { user, profile, signInWithGoogle } = useAuth();
  const {
    cartItems,
    products,
    catalogFromFirestore,
    cartSubtotal,
    cartDiscount,
    cartDeliveryCharge,
    cartTotal,
    clearCart,
    refreshCatalog,
    showToast,
  } = useStore();

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: profile?.displayName || user?.displayName || '',
    mobile: profile?.phone || '',
    email: profile?.email || user?.email || '',
  });

  const [delivery, setDelivery] = useState<DeliveryAddress>({
    address: '',
    city: '',
    state: 'Karnataka',
    pinCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Delivery');
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Unique idempotency key per checkout session to block double submissions
  const idempotencyKeyRef = useRef(
    `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  useEffect(() => {
    if (profile) {
      setCustomer((prev) => ({
        name: prev.name || profile.displayName || '',
        mobile: prev.mobile || profile.phone || '',
        email: prev.email || profile.email || '',
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    fetchUserAddresses(user.uid)
      .then((list) => setSavedAddresses(list))
      .catch(() => setSavedAddresses([]));
  }, [user]);

  const resolvedItems = useMemo(
    () =>
      cartItems
        .map((item) => ({
          ...item,
          product: products.find((p) => p.id === item.productId),
        }))
        .filter((e): e is { productId: string; quantity: number; product: NonNullable<typeof e.product> } =>
          Boolean(e.product)
        ),
    [cartItems, products]
  );

  const applySavedAddress = (addr: UserAddress) => {
    setCustomer((prev) => ({
      ...prev,
      name: addr.fullName || prev.name,
      mobile: addr.phone || prev.mobile,
    }));
    setDelivery({
      address: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pinCode: addr.pinCode,
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const validationErrors = validateCheckoutForm(customer, delivery);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const placedOrder = await placeOrderSecurely({
        userId: user ? user.uid : 'guest',
        idempotencyKey: idempotencyKeyRef.current,
        customerDetails: customer,
        deliveryAddress: delivery,
        paymentMethod,
        cartItems,
        catalogProducts: products,
        catalogFromFirestore,
      });

      await clearCart();
      void refreshCatalog();
      showToast('Order placed successfully!', 'success');
      navigate(`/order-confirmation/${placedOrder.orderId}`, {
        state: { order: placedOrder },
        replace: true,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (resolvedItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState
          title="Your bag is empty"
          description="Add products to your cart before proceeding to checkout."
          actionLabel="Browse Catalogue"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#202A27]">Checkout</h1>
          <p className="text-sm text-[#777F7B] mt-1">
            {user
              ? `Checking out as ${user.email}`
              : 'Guest checkout enabled — no account required.'}
          </p>
        </div>

        {!user && (
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="self-start sm:self-auto px-4 py-2 rounded-lg border border-[#E8ECE8] bg-white text-xs font-semibold text-[#26734D] hover:bg-[#F8F9F7] transition-colors cursor-pointer"
          >
            Sign in with Google to save order history
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Customer & Address Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Saved Addresses quick select for signed-in users */}
          {savedAddresses.length > 0 && (
            <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-sm font-bold text-[#202A27]">
                Saved Delivery Addresses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => applySavedAddress(addr)}
                    className="text-left p-3.5 rounded-xl border border-[#E8ECE8] hover:border-[#26734D] bg-[#F8F9F7] transition-colors cursor-pointer"
                  >
                    <p className="font-display text-xs font-bold text-[#202A27]">{addr.label}</p>
                    <p className="text-xs text-[#777F7B] mt-1 line-clamp-2">
                      {addr.fullName} · {addr.addressLine}, {addr.city} – {addr.pinCode}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#202A27]">
              1. Customer &amp; Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="chk-name" className="block text-xs font-semibold text-[#202A27] mb-1.5">
                  Customer Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Aarav Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl focus:outline-none focus:border-[#26734D] focus:bg-white"
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="chk-mobile" className="block text-xs font-semibold text-[#202A27] mb-1.5">
                  Mobile Number *
                </label>
                <input
                  id="chk-mobile"
                  type="tel"
                  required
                  value={customer.mobile}
                  onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl focus:outline-none focus:border-[#26734D] focus:bg-white"
                />
                {errors.mobile && <p className="text-xs text-rose-600 mt-1">{errors.mobile}</p>}
              </div>

              <div>
                <label htmlFor="chk-email" className="block text-xs font-semibold text-[#202A27] mb-1.5">
                  Email Address *
                </label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl focus:outline-none focus:border-[#26734D] focus:bg-white"
                />
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="chk-address" className="block text-xs font-semibold text-[#202A27] mb-1.5">
                  Street Address &amp; Landmark *
                </label>
                <textarea
                  id="chk-address"
                  rows={2}
                  required
                  value={delivery.address}
                  onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                  placeholder="Flat 402, Greenview Residency, Indiranagar"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl focus:outline-none focus:border-[#26734D] focus:bg-white"
                />
                {errors.address && <p className="text-xs text-rose-600 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="chk-city" className="block text-xs font-semibold text-[#202A27] mb-1.5">
                  City *
                </label>
                <input
                  id="chk-city"
                  type="text"
                  required
                  value={delivery.city}
                  onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                  placeholder="Bengaluru"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl focus:outline-none focus:border-[#26734D] focus:bg-white"
                />
                {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="chk-state" className="block text-xs font-semibold text-[#202A27] mb-1.5">
                  State *
                </label>
                <select
                  id="chk-state"
                  value={delivery.state}
                  onChange={(e) => setDelivery({ ...delivery, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl focus:outline-none focus:border-[#26734D] focus:bg-white"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="text-xs text-rose-600 mt-1">{errors.state}</p>}
              </div>

              <div>
                <label htmlFor="chk-pin" className="block text-xs font-semibold text-[#202A27] mb-1.5">
                  PIN Code (6 digits) *
                </label>
                <input
                  id="chk-pin"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={delivery.pinCode}
                  onChange={(e) =>
                    setDelivery({ ...delivery, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                  }
                  placeholder="560038"
                  className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl focus:outline-none focus:border-[#26734D] focus:bg-white"
                />
                {errors.pinCode && <p className="text-xs text-rose-600 mt-1">{errors.pinCode}</p>}
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#202A27]">2. Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-[#26734D] bg-[#26734D]/8'
                    : 'border-[#E8ECE8] bg-[#F8F9F7] hover:border-[#26734D]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Truck className="w-5 h-5 text-[#26734D]" />
                  {paymentMethod === 'Cash on Delivery' && (
                    <CheckCircle2 className="w-4 h-4 text-[#26734D]" />
                  )}
                </div>
                <p className="font-display text-sm font-bold text-[#202A27]">Cash on Delivery</p>
                <p className="text-xs text-[#777F7B] mt-0.5">
                  Pay in cash or UPI upon doorstep delivery.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Online Payment (Demo Mode)')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'Online Payment (Demo Mode)'
                    ? 'border-[#26734D] bg-[#26734D]/8'
                    : 'border-[#E8ECE8] bg-[#F8F9F7] hover:border-[#26734D]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <CreditCard className="w-5 h-5 text-[#26734D]" />
                  {paymentMethod === 'Online Payment (Demo Mode)' && (
                    <CheckCircle2 className="w-4 h-4 text-[#26734D]" />
                  )}
                </div>
                <p className="font-display text-sm font-bold text-[#202A27]">
                  Online Payment (Demo Mode)
                </p>
                <p className="text-xs text-[#777F7B] mt-0.5">
                  Instant simulated confirmation — no real card details collected.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 bg-white border border-[#E8ECE8] rounded-2xl p-6 sm:p-8 space-y-5 sticky top-24">
          <h2 className="font-display text-lg font-bold text-[#202A27]">Order Summary</h2>

          <div className="divide-y divide-[#E8ECE8] max-h-72 overflow-y-auto pr-1">
            {resolvedItems.map(({ product, quantity }) => (
              <div key={product.id} className="py-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F1F4F0] shrink-0">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#202A27] truncate">{product.name}</p>
                  <p className="text-xs text-[#777F7B] font-mono-num">
                    Qty {quantity} × {formatINR(product.price)}
                  </p>
                </div>
                <span className="font-mono-num text-sm font-semibold text-[#202A27] shrink-0">
                  {formatINR(product.price * quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E8ECE8] space-y-2 text-sm">
            <div className="flex justify-between text-[#777F7B]">
              <span>Subtotal</span>
              <span className="font-mono-num text-[#202A27]">{formatINR(cartSubtotal)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-[#26734D]">
                <span>You Save</span>
                <span className="font-mono-num">−{formatINR(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#777F7B]">
              <span>Delivery</span>
              <span className="font-mono-num text-[#202A27]">
                {cartDeliveryCharge === 0 ? 'Free' : formatINR(cartDeliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between font-display text-lg font-bold text-[#202A27] pt-3 border-t border-[#E8ECE8]">
              <span>Total Payable</span>
              <span className="font-mono-num">{formatINR(cartTotal)}</span>
            </div>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying &amp; Placing Order...
              </>
            ) : (
              `Place Order · ${formatINR(cartTotal)}`
            )}
          </button>

          <p className="text-[11px] text-[#777F7B] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#26734D]" />
            Totals verified server-side · Stock reserved atomically
          </p>

          <Link
            to="/cart"
            className="block text-center text-xs font-medium text-[#777F7B] hover:text-[#202A27]"
          >
            Back to Shopping Bag
          </Link>
        </aside>
      </form>
    </div>
  );
}
