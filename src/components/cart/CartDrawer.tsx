import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/formatCurrency';
import { FREE_DELIVERY_THRESHOLD } from '../../utils/validation';
import { SafeImage } from '../common/SafeImage';

export function CartDrawer() {
  const {
    isCartDrawerOpen,
    closeCartDrawer,
    cartItems,
    products,
    cartSubtotal,
    cartDiscount,
    cartDeliveryCharge,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
  } = useStore();

  if (!isCartDrawerOpen) return null;

  const remainingForFreeShipping = Math.max(0, FREE_DELIVERY_THRESHOLD - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={closeCartDrawer}
        aria-hidden="true"
        className="fixed inset-0 bg-[#202A27]/40 backdrop-blur-[2px] transition-opacity"
      />

      {/* Drawer Panel */}
      <aside
        aria-label="Shopping bag"
        className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-[#E8ECE8]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8ECE8]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#26734D]" />
            <h2 className="font-display text-lg font-bold text-[#202A27]">
              Shopping Bag ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCartDrawer}
            aria-label="Close shopping bag"
            className="p-2 rounded-lg text-[#777F7B] hover:text-[#202A27] hover:bg-[#F8F9F7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free delivery bar */}
        {cartItems.length > 0 && (
          <div className="px-6 py-3 bg-[#F8F9F7] border-b border-[#E8ECE8] text-xs text-[#202A27]">
            {remainingForFreeShipping === 0 ? (
              <span className="font-medium text-[#26734D]">
                You unlocked Free Standard Delivery across India.
              </span>
            ) : (
              <span>
                Add{' '}
                <strong className="font-mono-num text-[#26734D]">
                  {formatINR(remainingForFreeShipping)}
                </strong>{' '}
                more for Free Standard Delivery.
              </span>
            )}
          </div>
        )}

        {/* Line items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-[#777F7B]/50 mb-3" strokeWidth={1.5} />
              <p className="font-display text-base font-semibold text-[#202A27] mb-1">
                Your bag is empty
              </p>
              <p className="text-sm text-[#777F7B] mb-6 max-w-xs">
                Explore everyday electronics, home essentials, fashion, or try GiftMatch.
              </p>
              <Link
                to="/shop"
                onClick={closeCartDrawer}
                className="px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-sm font-medium hover:bg-[#1E5C3D] transition-colors"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            cartItems.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;
              return (
                <div
                  key={item.productId}
                  className="flex gap-4 pb-4 border-b border-[#E8ECE8] last:border-b-0"
                >
                  <Link
                    to={`/product/${product.slug}`}
                    onClick={closeCartDrawer}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-[#F1F4F0] shrink-0"
                  >
                    <SafeImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${product.slug}`}
                        onClick={closeCartDrawer}
                        className="font-display text-sm font-semibold text-[#202A27] hover:text-[#26734D] line-clamp-2"
                      >
                        {product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="text-[#777F7B] hover:text-rose-600 p-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono-num text-sm font-semibold text-[#202A27]">
                        {formatINR(product.price)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="font-mono-num text-xs text-[#777F7B] line-through">
                          {formatINR(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#E8ECE8] rounded-lg bg-[#F8F9F7]">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="p-1.5 text-[#202A27] hover:bg-[#EEF2EC] rounded-l-lg cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 font-mono-num text-xs font-semibold text-[#202A27]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product.id, item.quantity + 1)}
                          disabled={item.quantity >= product.stockQuantity}
                          aria-label="Increase quantity"
                          className="p-1.5 text-[#202A27] hover:bg-[#EEF2EC] disabled:opacity-40 rounded-r-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono-num text-xs font-medium text-[#777F7B]">
                        {formatINR(product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-[#E8ECE8] px-6 py-5 bg-[#F8F9F7] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#777F7B]">
                <span>Subtotal</span>
                <span className="font-mono-num text-[#202A27]">{formatINR(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#26734D]">
                  <span>Catalog Savings</span>
                  <span className="font-mono-num">−{formatINR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#777F7B]">
                <span>Delivery</span>
                <span className="font-mono-num text-[#202A27]">
                  {cartDeliveryCharge === 0 ? 'Free' : formatINR(cartDeliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between font-display font-bold text-base text-[#202A27] pt-2 border-t border-[#E8ECE8]">
                <span>Total</span>
                <span className="font-mono-num">{formatINR(cartTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/cart"
                onClick={closeCartDrawer}
                className="text-center px-4 py-2.5 rounded-lg border border-[#E8ECE8] bg-white text-[#202A27] text-sm font-medium hover:bg-[#F1F4F0] transition-colors whitespace-nowrap"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                onClick={closeCartDrawer}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#26734D] text-white text-sm font-medium hover:bg-[#1E5C3D] transition-colors whitespace-nowrap"
              >
                Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
