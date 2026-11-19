import type { Product } from './product';

export const RECIPIENT_OPTIONS = [
  'Friend',
  'Boyfriend',
  'Girlfriend',
  'Brother',
  'Sister',
  'Father',
  'Mother',
  'Teacher',
  'Colleague',
  'Others',
] as const;

export const OCCASION_OPTIONS = [
  'Birthday',
  'Anniversary',
  'Graduation',
  'Wedding',
  'Festival',
  'Thank You',
  'Celebration',
  'Just Because',
] as const;

export const INTEREST_OPTIONS = [
  'Technology',
  'Fashion',
  'Gaming',
  'Music',
  'Books',
  'Fitness',
  'Travelling',
  'Art',
  'Photography',
  'Home Decor',
  'Personal Care',
  'Sports',
] as const;

export const BUDGET_OPTIONS = [
  { id: 'under_500', label: 'Under ₹500', min: 0, max: 500 },
  { id: '500_1000', label: '₹500–₹1,000', min: 500, max: 1000 },
  { id: '1000_2000', label: '₹1,000–₹2,000', min: 1000, max: 2000 },
  { id: '2000_5000', label: '₹2,000–₹5,000', min: 2000, max: 5000 },
  { id: 'above_5000', label: 'Above ₹5,000', min: 5000, max: null },
] as const;

export const GIFT_STYLE_OPTIONS = [
  'Useful',
  'Stylish',
  'Personalized',
  'Premium',
  'Creative',
  'Surprise Me',
] as const;

export type GiftMatchRecipient = (typeof RECIPIENT_OPTIONS)[number];
export type GiftMatchOccasion = (typeof OCCASION_OPTIONS)[number];
export type GiftMatchInterest = (typeof INTEREST_OPTIONS)[number];
export type GiftMatchBudgetId = (typeof BUDGET_OPTIONS)[number]['id'];
export type GiftMatchStyle = (typeof GIFT_STYLE_OPTIONS)[number];

export interface GiftMatchInput {
  recipient?: GiftMatchRecipient | '';
  occasion?: GiftMatchOccasion | '';
  interests: GiftMatchInterest[];
  budgetId?: GiftMatchBudgetId | '';
  giftStyle?: GiftMatchStyle | '';
}

export interface GiftMatchRecommendation {
  product: Product;
  score: number;
  reasons: string[];
  breakdown: {
    recipientPoints: number;
    occasionPoints: number;
    interestPoints: number;
    budgetPoints: number;
    styleMatched: boolean;
  };
}
