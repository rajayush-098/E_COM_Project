import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../data/catalogSeed';
import {
  clearGuestCart,
  fetchUserCart,
  loadGuestCart,
  saveGuestCart,
  saveUserCart,
} from '../services/cartService';
import {
  fetchCategories,
  fetchProducts,
  seedInitialCatalogIdempotently,
} from '../services/productService';
import {
  fetchUserWishlist,
  loadGuestWishlist,
  saveGuestWishlist,
  saveUserWishlist,
} from '../services/wishlistService';
import type { CartItem } from '../types/order';
import type { Category, Product } from '../types/product';
import { calculateDeliveryCharge } from '../utils/validation';
import { useAuth } from './AuthContext';

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'info' | 'error';
}

interface StoreContextValue {
  categories: Category[];
  products: Product[];
  catalogLoading: boolean;
  catalogFromFirestore: boolean;
  catalogError: string | null;
  isSeeding: boolean;
  refreshCatalog: () => Promise<void>;
  initializeFirestoreCatalog: () => Promise<void>;
  getCategoryName: (categoryId: string) => string;

  // Cart
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartDeliveryCharge: number;
  cartTotal: number;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (productId: string, quantity?: number, openDrawer?: boolean) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => Promise<void>;

  // Wishlist
  wishlistIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (text: string, tone?: 'success' | 'info' | 'error') => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, authLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogFromFirestore, setCatalogFromFirestore] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadGuestCart());
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => loadGuestWishlist());
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const autoSeededRef = useRef(false);

  const showToast = useCallback(
    (text: string, tone: 'success' | 'info' | 'error' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3400);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetchCategories(false),
        fetchProducts(false),
      ]);

      if (catRes.fromFirestore && prodRes.fromFirestore) {
        setCategories(catRes.categories);
        setProducts(prodRes.products);
        setCatalogFromFirestore(true);
      } else {
        // Storefront stays navigable prior to first admin seed into Firestore
        setCategories(catRes.categories.length > 0 ? catRes.categories : SEED_CATEGORIES);
        setProducts(prodRes.products.length > 0 ? prodRes.products : SEED_PRODUCTS);
        setCatalogFromFirestore(false);
      }
    } catch (error) {
      console.error('Error loading Firestore catalog:', error);
      setCatalogError('Unable to reach Firestore catalogue right now.');
      setCategories(SEED_CATEGORIES);
      setProducts(SEED_PRODUCTS);
      setCatalogFromFirestore(false);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const initializeFirestoreCatalog = useCallback(async () => {
    if (!isAdmin) {
      showToast('Sign in with an Admin account to initialize the store database.', 'info');
      return;
    }
    setIsSeeding(true);
    try {
      const result = await seedInitialCatalogIdempotently();
      await refreshCatalog();
      if (result.productsCreated > 0 || result.categoriesCreated > 0) {
        showToast(
          `Synced ${result.categoriesCreated} categories & ${result.productsCreated} products to Firestore.`,
          'success'
        );
      } else {
        showToast('Firestore catalogue is already up to date.', 'info');
      }
    } catch (error) {
      console.error('Seeding error:', error);
      showToast('Failed to seed Firestore catalogue. Check admin permissions.', 'error');
    } finally {
      setIsSeeding(false);
    }
  }, [isAdmin, refreshCatalog, showToast]);

  // Load catalog on startup
  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  // Auto-seed Firestore idempotently as soon as an Admin signs in if DB is still empty
  useEffect(() => {
    if (!authLoading && isAdmin && !catalogLoading && !catalogFromFirestore && !autoSeededRef.current) {
      autoSeededRef.current = true;
      void initializeFirestoreCatalog();
    }
  }, [authLoading, isAdmin, catalogLoading, catalogFromFirestore, initializeFirestoreCatalog]);

  // Sync Cart & Wishlist with Firestore on Login/Logout
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCartItems(loadGuestCart());
      setWishlistIds(loadGuestWishlist());
      return;
    }

    let cancelled = false;
    async function syncOnSignIn(uid: string) {
      try {
        const [remoteCart, remoteWishlist] = await Promise.all([
          fetchUserCart(uid),
          fetchUserWishlist(uid),
        ]);

        const localCart = loadGuestCart();
        const mergedMap = new Map<string, number>();
        for (const item of remoteCart) mergedMap.set(item.productId, item.quantity);
        for (const item of localCart) {
          mergedMap.set(
            item.productId,
            Math.min(20, (mergedMap.get(item.productId) ?? 0) + item.quantity)
          );
        }
        const mergedCart: CartItem[] = Array.from(mergedMap.entries()).map(
          ([productId, quantity]) => ({ productId, quantity })
        );

        const localWish = loadGuestWishlist();
        const mergedWish = Array.from(new Set([...remoteWishlist, ...localWish])).slice(0, 100);

        if (!cancelled) {
          setCartItems(mergedCart);
          setWishlistIds(mergedWish);
        }

        if (localCart.length > 0) {
          await saveUserCart(uid, mergedCart);
          clearGuestCart();
        }
        if (localWish.length > 0) {
          await saveUserWishlist(uid, mergedWish);
          saveGuestWishlist([]);
        }
      } catch (err) {
        console.error('Error syncing cart/wishlist:', err);
      }
    }

    void syncOnSignIn(user.uid);
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const persistCart = useCallback(
    (nextItems: CartItem[]) => {
      setCartItems(nextItems);
      if (user) {
        void saveUserCart(user.uid, nextItems);
      } else {
        saveGuestCart(nextItems);
      }
    },
    [user]
  );

  const persistWishlist = useCallback(
    (nextIds: string[]) => {
      setWishlistIds(nextIds);
      if (user) {
        void saveUserWishlist(user.uid, nextIds);
      } else {
        saveGuestWishlist(nextIds);
      }
    },
    [user]
  );

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const getCategoryName = useCallback(
    (categoryId: string) => categoryById.get(categoryId)?.name ?? 'Everyday',
    [categoryById]
  );

  const addToCart = useCallback(
    (productId: string, quantity = 1, openDrawer = true) => {
      const product = productById.get(productId);
      if (!product) return;
      if (product.stockQuantity <= 0) {
        showToast('This item is currently out of stock.', 'error');
        return;
      }

      const existing = cartItems.find((i) => i.productId === productId);
      const maxAllowed = Math.min(20, product.stockQuantity);
      const desired = (existing?.quantity ?? 0) + quantity;
      const clamped = Math.min(maxAllowed, Math.max(1, desired));

      if (existing && existing.quantity >= maxAllowed) {
        showToast(`Maximum available stock (${maxAllowed}) already in cart.`, 'info');
        if (openDrawer) setIsCartDrawerOpen(true);
        return;
      }

      const next = existing
        ? cartItems.map((i) => (i.productId === productId ? { ...i, quantity: clamped } : i))
        : [...cartItems, { productId, quantity: clamped }];

      persistCart(next);
      showToast(`Added "${product.name}" to your bag.`, 'success');
      if (openDrawer) setIsCartDrawerOpen(true);
    },
    [cartItems, persistCart, productById, showToast]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      const product = productById.get(productId);
      if (quantity <= 0) {
        persistCart(cartItems.filter((i) => i.productId !== productId));
        return;
      }
      const maxStock = product ? Math.min(20, Math.max(1, product.stockQuantity)) : 20;
      if (quantity > maxStock) {
        showToast(`Only ${maxStock} unit(s) available in stock.`, 'info');
      }
      const clamped = Math.min(maxStock, quantity);
      persistCart(
        cartItems.map((i) => (i.productId === productId ? { ...i, quantity: clamped } : i))
      );
    },
    [cartItems, persistCart, productById, showToast]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      persistCart(cartItems.filter((i) => i.productId !== productId));
      showToast('Item removed from bag.', 'info');
    },
    [cartItems, persistCart, showToast]
  );

  const clearCart = useCallback(async () => {
    setCartItems([]);
    if (user) {
      await saveUserCart(user.uid, []);
    } else {
      clearGuestCart();
    }
  }, [user]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      const exists = wishlistIds.includes(productId);
      const next = exists
        ? wishlistIds.filter((id) => id !== productId)
        : [...wishlistIds, productId];
      persistWishlist(next);
      showToast(exists ? 'Removed from wishlist.' : 'Saved to wishlist.', 'info');
    },
    [wishlistIds, persistWishlist, showToast]
  );

  const { cartCount, cartSubtotal, cartDiscount, cartDeliveryCharge, cartTotal } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    let discount = 0;
    for (const item of cartItems) {
      const p = productById.get(item.productId);
      if (!p) continue;
      count += item.quantity;
      subtotal += p.price * item.quantity;
      discount += Math.max(0, p.originalPrice - p.price) * item.quantity;
    }
    const delivery = calculateDeliveryCharge(subtotal);
    return {
      cartCount: count,
      cartSubtotal: subtotal,
      cartDiscount: discount,
      cartDeliveryCharge: delivery,
      cartTotal: subtotal + delivery,
    };
  }, [cartItems, productById]);

  return (
    <StoreContext.Provider
      value={{
        categories,
        products,
        catalogLoading,
        catalogFromFirestore,
        catalogError,
        isSeeding,
        refreshCatalog,
        initializeFirestoreCatalog,
        getCategoryName,
        cartItems,
        cartCount,
        cartSubtotal,
        cartDiscount,
        cartDeliveryCharge,
        cartTotal,
        isCartDrawerOpen,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        wishlistIds,
        isWishlisted,
        toggleWishlist,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
