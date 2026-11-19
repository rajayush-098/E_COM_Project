export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  imageUrl: string;
  gallery: string[];
  sku: string;
  stockQuantity: number;
  ratingAverage: number;
  ratingCount: number;
  popularityScore: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isGiftable: boolean;
  recipients: string[];
  occasions: string[];
  interests: string[];
  giftStyles: string[];
  tags: string[];
  specs: Record<string, string>;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export type ProductSortOption =
  | 'popularity'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'rating';

export interface ProductFiltersState {
  search: string;
  categoryId: string;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  inStockOnly: boolean;
  dealsOnly: boolean;
  sortBy: ProductSortOption;
}
