import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/common/Feedback';
import { SafeImage } from '../components/common/SafeImage';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../utils/formatCurrency';
import { FREE_DELIVERY_THRESHOLD } from '../utils/validation';

export function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    products,
    cartSubtotal,
    cartDiscount,
    cartDeliveryCharge,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
    getCategoryName,
  } = useStore();

  const resolvedItems = cartItems
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId),
    }))
    .filter((entry): entry is { productId: string; quantity: number; product: NonNullable<typeof entry.product> } =>
      Boolean(entry.product)
    );

  if (resolvedItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState
          title="Your shopping bag is empty"
          description="Browse everyday electronics, home living, fashion, or use GiftMatch to discover something memorable."
          actionLabel="Explore Products"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-[#202A27] mb-8">
        Shopping Cart ({resolvedItems.reduce((sum, i) => sum + i.quantity, 0)} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items Table / Cards */}
        <div className="lg:col-span-8 bg-white border border-[#E8ECE8] rounded-2xl divide-y divide-[#E8ECE8]">
          {resolvedItems.map(({ product, quantity }) => (
            <div key={product.id} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
              <Link
                to={`/product/${product.slug}`}
                className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-[#F1F4F0] shrink-0"
              >
                <SafeImage
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#777F7B]">{getCategoryName(product.categoryId)}</p>
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-display text-base font-bold text-[#202A27] hover:text-[#26734D]"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-mono-num text-sm font-bold text-[#202A27]">
                        {formatINR(product.price)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="font-mono-num text-xs text-[#777F7B] line-through">
                          {formatINR(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Remove ${product.name}`}
                    className="p-2 text-[#777F7B] hover:text-rose-600 rounded-lg hover:bg-[#F8F9F7] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center border border-[#E8ECE8] rounded-lg bg-[#F8F9F7]">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, quantity - 1)}
                      aria-label="Decrease quantity"
                      className="p-2 text-[#202A27] hover:bg-[#EEF2EC] rounded-l-lg cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 font-mono-num text-sm font-semibold text-[#202A27]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= product.stockQuantity}
                      onClick={() => updateCartQuantity(product.id, quantity + 1)}
                      aria-label="Increase quantity"
                      className="p-2 text-[#202A27] hover:bg-[#EEF2EC] disabled:opacity-40 rounded-r-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-mono-num text-base font-bold text-[#202A27]">
                      {formatINR(product.price * quantity)}
                    </span>
                    {quantity >= product.stockQuantity && (
                      <p className="text-[11px] text-[#C86428]">Max stock reached</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <aside className="lg:col-span-4 bg-white border border-[#E8ECE8] rounded-2xl p-6 space-y-5 sticky top-24">
          <h2 className="font-display text-lg font-bold text-[#202A27]">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[#777F7B]">
              <span>Subtotal</span>
              <span className="font-mono-num text-[#202A27]">{formatINR(cartSubtotal)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-[#26734D]">
                <span>Product Discounts</span>
                <span className="font-mono-num">−{formatINR(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#777F7B]">
              <span>Delivery Charge</span>
              <span className="font-mono-num text-[#202A27]">
                {cartDeliveryCharge === 0 ? 'Free' : formatINR(cartDeliveryCharge)}
              </span>
            </div>
            {cartSubtotal < FREE_DELIVERY_THRESHOLD && (
              <p className="text-xs text-[#777F7B] bg-[#F8F9F7] px-3 py-2 rounded-lg">
                Add{' '}
                <strong className="font-mono-num text-[#26734D]">
                  {formatINR(FREE_DELIVERY_THRESHOLD - cartSubtotal)}
                </strong>{' '}
                more to qualify for free standard shipping.
              </p>
            )}
            <div className="flex justify-between font-display text-lg font-bold text-[#202A27] pt-3 border-t border-[#E8ECE8]">
              <span>Total</span>
              <span className="font-mono-num">{formatINR(cartTotal)}</span>
            </div>
          </div>

          <Link
            to="/checkout"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] transition-colors"
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/shop"
            className="block text-center text-xs font-medium text-[#777F7B] hover:text-[#26734D]"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
