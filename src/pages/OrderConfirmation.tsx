import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Package } from 'lucide-react';
import { SafeImage } from '../components/common/SafeImage';
import { useAuth } from '../context/AuthContext';
import { fetchOrderById, loadLastOrderReceipt } from '../services/orderService';
import type { Order } from '../types/order';
import { formatDateIN, formatINR } from '../utils/formatCurrency';

export function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const { user } = useAuth();

  const navOrder = (location.state as { order?: Order } | null)?.order ?? null;
  const [order, setOrder] = useState<Order | null>(
    navOrder ?? (orderId ? loadLastOrderReceipt(orderId) : null)
  );
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (order || !orderId) return;
    fetchOrderById(orderId)
      .then((found) => setOrder(found))
      .finally(() => setLoading(false));
  }, [order, orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-[#777F7B]">
        Loading your order receipt...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-10 h-10 text-[#777F7B] mx-auto" />
        <h1 className="font-display text-2xl font-bold text-[#202A27]">Order receipt unavailable</h1>
        <p className="text-sm text-[#777F7B]">
          If you placed this order while signed in, you can view it anytime in your Order History.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/account"
            className="px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-sm font-medium"
          >
            View Order History
          </Link>
          <Link
            to="/shop"
            className="px-5 py-2.5 rounded-lg border border-[#E8ECE8] bg-white text-sm font-medium text-[#202A27]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white border border-[#E8ECE8] rounded-3xl p-6 sm:p-10 space-y-8">
        {/* Confirmation Header */}
        <div className="text-center space-y-3 pb-6 border-b border-[#E8ECE8]">
          <div className="w-14 h-14 rounded-2xl bg-[#26734D]/12 text-[#26734D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#202A27]">
            Your Order Has Been Placed Successfully!
          </h1>
          <p className="text-sm text-[#777F7B]">
            Thank you, {order.customerDetails.name}. We&apos;ve recorded your order and reserved
            your items.
          </p>
        </div>

        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#777F7B]">Order ID</p>
            <p className="font-mono-num font-bold text-[#202A27] mt-0.5">{order.orderId}</p>
          </div>
          <div>
            <p className="text-xs text-[#777F7B]">Order Date</p>
            <p className="font-medium text-[#202A27] mt-0.5">{formatDateIN(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-[#777F7B]">Order Status</p>
            <p className="font-semibold text-[#26734D] mt-0.5">{order.orderStatus}</p>
          </div>
          <div>
            <p className="text-xs text-[#777F7B]">Payment</p>
            <p className="font-medium text-[#202A27] mt-0.5">
              {order.paymentMethod} ({order.paymentStatus})
            </p>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="pt-6 border-t border-[#E8ECE8] space-y-4">
          <h2 className="font-display text-base font-bold text-[#202A27]">Ordered Products</h2>
          <div className="divide-y divide-[#E8ECE8] border border-[#E8ECE8] rounded-xl">
            {order.items.map((item) => (
              <div key={item.productId} className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F1F4F0] shrink-0">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#202A27] truncate">{item.name}</p>
                  <p className="text-xs text-[#777F7B] font-mono-num">
                    {formatINR(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="font-mono-num text-sm font-bold text-[#202A27]">
                  {formatINR(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery & Totals */}
        <div className="pt-6 border-t border-[#E8ECE8] grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-display text-sm font-bold text-[#202A27] mb-1.5">
              Delivery Address
            </h3>
            <p className="text-[#777F7B] leading-relaxed">
              {order.customerDetails.name}
              <br />
              {order.deliveryAddress.address}
              <br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state} –{' '}
              <span className="font-mono-num">{order.deliveryAddress.pinCode}</span>
              <br />
              Mobile: <span className="font-mono-num">{order.customerDetails.mobile}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[#777F7B]">
              <span>Subtotal</span>
              <span className="font-mono-num text-[#202A27]">{formatINR(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[#26734D]">
                <span>Savings</span>
                <span className="font-mono-num">−{formatINR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#777F7B]">
              <span>Delivery</span>
              <span className="font-mono-num text-[#202A27]">
                {order.deliveryCharge === 0 ? 'Free' : formatINR(order.deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between font-display text-base font-bold text-[#202A27] pt-2 border-t border-[#E8ECE8]">
              <span>Total Paid / Due</span>
              <span className="font-mono-num">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          {user && (
            <Link
              to="/account"
              className="px-5 py-3 rounded-xl border border-[#E8ECE8] bg-[#F8F9F7] text-sm font-semibold text-[#202A27] hover:bg-[#EEF2EC] transition-colors"
            >
              View Order History
            </Link>
          )}
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
