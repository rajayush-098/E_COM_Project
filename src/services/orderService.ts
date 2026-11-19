import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type {
  CartItem,
  CustomerDetails,
  DeliveryAddress,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types/order';
import type { Product } from '../types/product';
import { calculateDeliveryCharge } from '../utils/validation';

const LAST_ORDER_STORAGE_KEY = 'giftly_last_order_receipt_v1';

function toIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function mapOrderDoc(id: string, data: Record<string, unknown>): Order {
  return {
    orderId: String(data.orderId ?? id),
    userId: String(data.userId ?? 'guest'),
    idempotencyKey: String(data.idempotencyKey ?? ''),
    customerDetails: (data.customerDetails as CustomerDetails) ?? {
      name: '',
      mobile: '',
      email: '',
    },
    deliveryAddress: (data.deliveryAddress as DeliveryAddress) ?? {
      address: '',
      city: '',
      state: '',
      pinCode: '',
    },
    items: Array.isArray(data.items) ? (data.items as OrderItemSnapshot[]) : [],
    subtotal: Number(data.subtotal ?? 0),
    discount: Number(data.discount ?? 0),
    deliveryCharge: Number(data.deliveryCharge ?? 0),
    total: Number(data.total ?? 0),
    paymentMethod: (data.paymentMethod as PaymentMethod) ?? 'Cash on Delivery',
    paymentStatus: (data.paymentStatus as PaymentStatus) ?? 'Pending',
    orderStatus: (data.orderStatus as OrderStatus) ?? 'Pending',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function saveLastOrderReceipt(order: Order): void {
  try {
    sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Ignore
  }
}

export function loadLastOrderReceipt(orderId?: string): Order | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Order;
    if (orderId && parsed.orderId !== orderId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function placeOrderSecurely(params: {
  userId: string;
  idempotencyKey: string;
  customerDetails: CustomerDetails;
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
  cartItems: CartItem[];
  catalogProducts: Product[];
  catalogFromFirestore: boolean;
}): Promise<Order> {
  // Step 1: Server-side validation & authoritative total calculation
  const serverRes = await fetch('/api/orders/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idempotencyKey: params.idempotencyKey,
      customerDetails: params.customerDetails,
      deliveryAddress: params.deliveryAddress,
      paymentMethod: params.paymentMethod,
      items: params.cartItems,
      catalogProducts: params.catalogProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        stockQuantity: p.stockQuantity,
        imageUrl: p.imageUrl,
        isActive: p.isActive,
      })),
    }),
  });

  const serverJson = await serverRes.json();
  if (!serverRes.ok) {
    throw new Error(serverJson.error || 'Order validation failed on server.');
  }

  const orderId: string = serverJson.orderId;
  const paymentStatus: PaymentStatus =
    params.paymentMethod === 'Online Payment (Demo Mode)' ? 'Paid (Demo)' : 'Pending';

  const orderRef = doc(db, 'orders', orderId);

  // Step 2: Atomic Firestore transaction reading live prices/stock, decrementing inventory, and saving order
  try {
    const finalOrder = await runTransaction(db, async (transaction) => {
      const existingOrderSnap = await transaction.get(orderRef);
      if (existingOrderSnap.exists()) {
        return mapOrderDoc(existingOrderSnap.id, existingOrderSnap.data());
      }

      let subtotal = 0;
      let totalDiscount = 0;
      const snapshots: OrderItemSnapshot[] = [];

      if (params.catalogFromFirestore) {
        const productRefs = params.cartItems.map((item) => doc(db, 'products', item.productId));
        const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

        for (let i = 0; i < params.cartItems.length; i++) {
          const item = params.cartItems[i];
          const pSnap = productSnaps[i];
          if (!pSnap.exists()) {
            throw new Error('One of the items in your cart is no longer available.');
          }
          const pData = pSnap.data();
          if (!pData.isActive) {
            throw new Error(`"${pData.name}" is currently unavailable.`);
          }
          const availableStock = Number(pData.stockQuantity ?? 0);
          if (item.quantity > availableStock) {
            throw new Error(
              `Only ${availableStock} unit(s) of "${pData.name}" left in stock.`
            );
          }

          const unitPrice = Number(pData.price);
          const originalPrice = Math.max(unitPrice, Number(pData.originalPrice ?? unitPrice));
          const lineTotal = unitPrice * item.quantity;
          subtotal += lineTotal;
          totalDiscount += (originalPrice - unitPrice) * item.quantity;

          snapshots.push({
            productId: pSnap.id,
            name: String(pData.name),
            imageUrl: String(pData.imageUrl ?? ''),
            unitPrice,
            originalPrice,
            quantity: item.quantity,
            lineTotal,
          });

          // Atomically decrement inventory
          transaction.update(productRefs[i], {
            stockQuantity: availableStock - item.quantity,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // Fallback if store admin hasn't seeded Firestore yet: use server-verified snapshots
        for (const item of serverJson.items as OrderItemSnapshot[]) {
          subtotal += item.lineTotal;
          totalDiscount += (item.originalPrice - item.unitPrice) * item.quantity;
          snapshots.push(item);
        }
      }

      const deliveryCharge = calculateDeliveryCharge(subtotal);
      const total = subtotal + deliveryCharge;

      const orderDoc = {
        orderId,
        userId: params.userId,
        idempotencyKey: params.idempotencyKey,
        customerDetails: {
          name: params.customerDetails.name.trim().slice(0, 100),
          mobile: params.customerDetails.mobile.trim().slice(0, 15),
          email: params.customerDetails.email.trim().slice(0, 160),
        },
        deliveryAddress: {
          address: params.deliveryAddress.address.trim().slice(0, 250),
          city: params.deliveryAddress.city.trim().slice(0, 80),
          state: params.deliveryAddress.state.trim().slice(0, 80),
          pinCode: params.deliveryAddress.pinCode.trim(),
        },
        items: snapshots,
        subtotal,
        discount: totalDiscount,
        deliveryCharge,
        total,
        paymentMethod: params.paymentMethod,
        paymentStatus,
        orderStatus: 'Pending' as OrderStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(orderRef, orderDoc);

      return {
        ...orderDoc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Order;
    });

    saveLastOrderReceipt(finalOrder);
    return finalOrder;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
  }
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const local = loadLastOrderReceipt(orderId);
  const path = `orders/${orderId}`;
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return local;
    return mapOrderDoc(snap.id, snap.data());
  } catch {
    return local;
  }
}

export async function fetchUserOrders(uid: string): Promise<Order[]> {
  const path = 'orders';
  try {
    const q = query(collection(db, path), where('userId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapOrderDoc(d.id, d.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllOrdersAdmin(): Promise<Order[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => mapOrderDoc(d.id, d.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateOrderStatusAdmin(
  orderId: string,
  orderStatus: OrderStatus,
  paymentStatus: PaymentStatus
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus,
      paymentStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchTotalCustomersCountAdmin(): Promise<number> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.size;
  } catch {
    return 0;
  }
}
