import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../data/catalogSeed';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type { Category, Product, Review } from '../types/product';
import { calculateDiscountPercentage, slugify } from '../utils/formatCurrency';

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function mapProductDoc(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: String(data.name ?? ''),
    slug: String(data.slug ?? id),
    description: String(data.description ?? ''),
    shortDescription: String(data.shortDescription ?? ''),
    categoryId: String(data.categoryId ?? ''),
    price: Number(data.price ?? 0),
    originalPrice: Number(data.originalPrice ?? data.price ?? 0),
    discountPercentage: Number(data.discountPercentage ?? 0),
    imageUrl: String(data.imageUrl ?? ''),
    gallery: Array.isArray(data.gallery) ? data.gallery.map(String) : [],
    sku: String(data.sku ?? ''),
    stockQuantity: Number(data.stockQuantity ?? 0),
    ratingAverage: Number(data.ratingAverage ?? 4.5),
    ratingCount: Number(data.ratingCount ?? 0),
    popularityScore: Number(data.popularityScore ?? 50),
    isActive: Boolean(data.isActive),
    isFeatured: Boolean(data.isFeatured),
    isNewArrival: Boolean(data.isNewArrival),
    isBestSeller: Boolean(data.isBestSeller),
    isGiftable: Boolean(data.isGiftable),
    recipients: Array.isArray(data.recipients) ? data.recipients.map(String) : [],
    occasions: Array.isArray(data.occasions) ? data.occasions.map(String) : [],
    interests: Array.isArray(data.interests) ? data.interests.map(String) : [],
    giftStyles: Array.isArray(data.giftStyles) ? data.giftStyles.map(String) : [],
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    specs:
      data.specs && typeof data.specs === 'object'
        ? (data.specs as Record<string, string>)
        : {},
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export async function fetchCategories(includeInactive = false): Promise<{
  categories: Category[];
  fromFirestore: boolean;
}> {
  const path = 'categories';
  try {
    const colRef = collection(db, path);
    const q = includeInactive ? query(colRef) : query(colRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { categories: [], fromFirestore: false };
    }

    const categories: Category[] = snapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name ?? ''),
          slug: String(data.slug ?? d.id),
          description: String(data.description ?? ''),
          imageUrl: String(data.imageUrl ?? ''),
          isActive: Boolean(data.isActive),
          displayOrder: Number(data.displayOrder ?? 0),
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return { categories, fromFirestore: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchProducts(includeInactive = false): Promise<{
  products: Product[];
  fromFirestore: boolean;
}> {
  const path = 'products';
  try {
    const colRef = collection(db, path);
    const q = includeInactive ? query(colRef) : query(colRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { products: [], fromFirestore: false };
    }

    const products = snapshot.docs.map((d) => mapProductDoc(d.id, d.data()));
    return { products, fromFirestore: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  const path = `products/${productId}`;
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) return null;
    return mapProductDoc(snap.id, snap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const path = 'reviews';
  try {
    const q = query(collection(db, path), where('productId', '==', productId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          productId: String(data.productId ?? ''),
          userId: String(data.userId ?? ''),
          userName: String(data.userName ?? 'Customer'),
          rating: Number(data.rating ?? 5),
          reviewText: String(data.reviewText ?? ''),
          createdAt: toIsoString(data.createdAt),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function submitProductReview(params: {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  reviewText: string;
}): Promise<Review> {
  const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `reviews/${reviewId}`;
  const cleanName = params.userName.trim().slice(0, 80) || 'Verified Buyer';
  const cleanText = params.reviewText.trim().slice(0, 1000);
  const cleanRating = Math.min(5, Math.max(1, Math.round(params.rating)));

  try {
    await setDoc(doc(db, 'reviews', reviewId), {
      productId: params.productId,
      userId: params.userId,
      userName: cleanName,
      rating: cleanRating,
      reviewText: cleanText,
      createdAt: serverTimestamp(),
    });
    return {
      id: reviewId,
      productId: params.productId,
      userId: params.userId,
      userName: cleanName,
      rating: cleanRating,
      reviewText: cleanText,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Idempotent Firestore seeding for initial categories & products.
 * Never duplicates existing docs and never overwrites user/admin data.
 */
export async function seedInitialCatalogIdempotently(): Promise<{
  categoriesCreated: number;
  productsCreated: number;
}> {
  let categoriesCreated = 0;
  let productsCreated = 0;

  try {
    const existingCatsSnap = await getDocs(collection(db, 'categories'));
    const existingCatIds = new Set(existingCatsSnap.docs.map((d) => d.id));

    const existingProdsSnap = await getDocs(collection(db, 'products'));
    const existingProdIds = new Set(existingProdsSnap.docs.map((d) => d.id));

    const batch = writeBatch(db);
    let ops = 0;

    for (const cat of SEED_CATEGORIES) {
      if (!existingCatIds.has(cat.id)) {
        batch.set(doc(db, 'categories', cat.id), {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          imageUrl: cat.imageUrl,
          isActive: cat.isActive,
          displayOrder: cat.displayOrder,
        });
        categoriesCreated++;
        ops++;
      }
    }

    for (const prod of SEED_PRODUCTS) {
      if (!existingProdIds.has(prod.id)) {
        batch.set(doc(db, 'products', prod.id), {
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          shortDescription: prod.shortDescription,
          categoryId: prod.categoryId,
          price: prod.price,
          originalPrice: prod.originalPrice,
          discountPercentage: prod.discountPercentage,
          imageUrl: prod.imageUrl,
          gallery: prod.gallery.slice(0, 8),
          sku: prod.sku,
          stockQuantity: Math.floor(prod.stockQuantity),
          ratingAverage: prod.ratingAverage,
          ratingCount: Math.floor(prod.ratingCount),
          popularityScore: prod.popularityScore,
          isActive: prod.isActive,
          isFeatured: prod.isFeatured,
          isNewArrival: prod.isNewArrival,
          isBestSeller: prod.isBestSeller,
          isGiftable: prod.isGiftable,
          recipients: prod.recipients.slice(0, 15),
          occasions: prod.occasions.slice(0, 15),
          interests: prod.interests.slice(0, 15),
          giftStyles: prod.giftStyles.slice(0, 10),
          tags: prod.tags.slice(0, 20),
          specs: prod.specs,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        productsCreated++;
        ops++;
      }
    }

    if (ops > 0) {
      await batch.commit();
    }

    return { categoriesCreated, productsCreated };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }
}

export interface ProductUpsertPayload {
  name: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  sku: string;
  stockQuantity: number;
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
}

export async function createProductAdmin(payload: ProductUpsertPayload): Promise<string> {
  const cleanSlug = slugify(payload.name) || `product-${Date.now()}`;
  const productId = `prod-${cleanSlug.slice(0, 40)}-${Date.now().toString(36).slice(-4)}`;
  const path = `products/${productId}`;
  const safePrice = Math.max(1, Math.round(payload.price));
  const safeOriginal = Math.max(safePrice, Math.round(payload.originalPrice));
  const discountPercentage = calculateDiscountPercentage(safePrice, safeOriginal);
  const cleanSku =
    payload.sku
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 40) || `GL-${Date.now().toString().slice(-6)}`;

  try {
    await setDoc(doc(db, 'products', productId), {
      name: payload.name.trim().slice(0, 140),
      slug: cleanSlug,
      description: payload.description.trim().slice(0, 2500),
      shortDescription: payload.shortDescription.trim().slice(0, 300),
      categoryId: payload.categoryId,
      price: safePrice,
      originalPrice: safeOriginal,
      discountPercentage,
      imageUrl: payload.imageUrl.trim().slice(0, 500),
      gallery: [payload.imageUrl.trim().slice(0, 500)],
      sku: cleanSku,
      stockQuantity: Math.max(0, Math.floor(payload.stockQuantity)),
      ratingAverage: 4.5,
      ratingCount: 0,
      popularityScore: 70,
      isActive: payload.isActive,
      isFeatured: payload.isFeatured,
      isNewArrival: payload.isNewArrival,
      isBestSeller: payload.isBestSeller,
      isGiftable: payload.isGiftable,
      recipients: payload.recipients.slice(0, 15),
      occasions: payload.occasions.slice(0, 15),
      interests: payload.interests.slice(0, 15),
      giftStyles: payload.giftStyles.slice(0, 10),
      tags: payload.tags.slice(0, 20),
      specs: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return productId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProductAdmin(
  productId: string,
  payload: ProductUpsertPayload
): Promise<void> {
  const path = `products/${productId}`;
  const safePrice = Math.max(1, Math.round(payload.price));
  const safeOriginal = Math.max(safePrice, Math.round(payload.originalPrice));
  const discountPercentage = calculateDiscountPercentage(safePrice, safeOriginal);
  const cleanSku =
    payload.sku
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 40) || 'GL-SKU-001';

  try {
    await updateDoc(doc(db, 'products', productId), {
      name: payload.name.trim().slice(0, 140),
      slug: slugify(payload.name) || productId,
      description: payload.description.trim().slice(0, 2500),
      shortDescription: payload.shortDescription.trim().slice(0, 300),
      categoryId: payload.categoryId,
      price: safePrice,
      originalPrice: safeOriginal,
      discountPercentage,
      imageUrl: payload.imageUrl.trim().slice(0, 500),
      gallery: [payload.imageUrl.trim().slice(0, 500)],
      sku: cleanSku,
      stockQuantity: Math.max(0, Math.floor(payload.stockQuantity)),
      isActive: payload.isActive,
      isFeatured: payload.isFeatured,
      isNewArrival: payload.isNewArrival,
      isBestSeller: payload.isBestSeller,
      isGiftable: payload.isGiftable,
      recipients: payload.recipients.slice(0, 15),
      occasions: payload.occasions.slice(0, 15),
      interests: payload.interests.slice(0, 15),
      giftStyles: payload.giftStyles.slice(0, 10),
      tags: payload.tags.slice(0, 20),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductAdmin(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCategoryAdmin(cat: {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}): Promise<string> {
  const cleanSlug = slugify(cat.name) || `category-${Date.now()}`;
  const categoryId = cat.id || cleanSlug;
  const path = `categories/${categoryId}`;

  try {
    await setDoc(doc(db, 'categories', categoryId), {
      name: cat.name.trim().slice(0, 80),
      slug: cleanSlug,
      description: cat.description.trim().slice(0, 500),
      imageUrl: cat.imageUrl.trim().slice(0, 500),
      isActive: cat.isActive,
      displayOrder: Math.max(0, Math.min(1000, Math.round(cat.displayOrder))),
    });
    return categoryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryAdmin(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
