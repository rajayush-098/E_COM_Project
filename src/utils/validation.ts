import type { CustomerDetails, DeliveryAddress } from '../types/order';

export const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;
export const PHONE_IN_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SLUG_REGEX = /^[a-z0-9-]+$/;
export const SKU_REGEX = /^[A-Z0-9\-]+$/;

export interface CheckoutFormErrors {
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export function validateCheckoutForm(
  customer: CustomerDetails,
  delivery: DeliveryAddress
): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  if (!customer.name.trim() || customer.name.trim().length < 2) {
    errors.name = 'Enter your full name (at least 2 characters).';
  } else if (customer.name.trim().length > 100) {
    errors.name = 'Name must be 100 characters or fewer.';
  }

  const normalizedPhone = customer.mobile.replace(/\s+/g, '');
  if (!PHONE_IN_REGEX.test(normalizedPhone)) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number.';
  }

  if (!EMAIL_REGEX.test(customer.email.trim()) || customer.email.trim().length > 160) {
    errors.email = 'Enter a valid email address.';
  }

  if (!delivery.address.trim() || delivery.address.trim().length < 5) {
    errors.address = 'Enter a complete street address (at least 5 characters).';
  } else if (delivery.address.trim().length > 250) {
    errors.address = 'Address must be 250 characters or fewer.';
  }

  if (!delivery.city.trim() || delivery.city.trim().length < 2) {
    errors.city = 'Enter a valid city name.';
  }

  if (!delivery.state.trim() || delivery.state.trim().length < 2) {
    errors.state = 'Select or enter a valid state.';
  }

  if (!PIN_CODE_REGEX.test(delivery.pinCode.trim())) {
    errors.pinCode = 'Enter a valid 6-digit Indian PIN code.';
  }

  return errors;
}

export const FREE_DELIVERY_THRESHOLD = 999;
export const STANDARD_DELIVERY_CHARGE = 79;

export function calculateDeliveryCharge(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_CHARGE;
}

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];
