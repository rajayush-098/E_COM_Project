export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CustomerDetails {
  name: string;
  mobile: string;
  email: string;
}

export interface DeliveryAddress {
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

export type PaymentMethod = 'Cash on Delivery' | 'Online Payment (Demo Mode)';
export type PaymentStatus = 'Pending' | 'Paid (Demo)' | 'Refunded';
export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  orderId: string;
  userId: string;
  idempotencyKey: string;
  customerDetails: CustomerDetails;
  deliveryAddress: DeliveryAddress;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUS_LIST: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];
