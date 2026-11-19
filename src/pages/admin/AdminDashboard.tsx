import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Edit3,
  FolderKanban,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  Package,
  Plus,
  ShieldAlert,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { SafeImage } from '../../components/common/SafeImage';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { STORE_IMAGES } from '../../data/catalogSeed';
import {
  fetchAllOrdersAdmin,
  fetchTotalCustomersCountAdmin,
  updateOrderStatusAdmin,
} from '../../services/orderService';
import {
  createProductAdmin,
  deleteCategoryAdmin,
  deleteProductAdmin,
  fetchCategories,
  fetchProducts,
  updateProductAdmin,
  upsertCategoryAdmin,
  type ProductUpsertPayload,
} from '../../services/productService';
import {
  GIFT_STYLE_OPTIONS,
  INTEREST_OPTIONS,
  OCCASION_OPTIONS,
  RECIPIENT_OPTIONS,
} from '../../types/giftmatch';
import { ORDER_STATUS_LIST, type Order, type OrderStatus, type PaymentStatus } from '../../types/order';
import type { Category, Product } from '../../types/product';
import { formatDateIN, formatINR } from '../../utils/formatCurrency';

type AdminTab = 'overview' | 'products' | 'categories' | 'orders';

const EMPTY_PRODUCT_FORM: ProductUpsertPayload = {
  name: '',
  shortDescription: '',
  description: '',
  categoryId: 'electronics',
  price: 999,
  originalPrice: 1299,
  imageUrl: STORE_IMAGES.earbuds,
  sku: 'GL-NEW-001',
  stockQuantity: 25,
  isActive: true,
  isFeatured: false,
  isNewArrival: true,
  isBestSeller: false,
  isGiftable: true,
  recipients: ['Friend'],
  occasions: ['Birthday'],
  interests: ['Technology'],
  giftStyles: ['Useful'],
  tags: [],
};

export function AdminDashboard() {
  const { user, isAdmin, authLoading } = useAuth();
  const { initializeFirestoreCatalog, isSeeding, refreshCatalog, showToast } = useStore();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Product modal / editor state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<ProductUpsertPayload>(EMPTY_PRODUCT_FORM);
  const [tagsInput, setTagsInput] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Category editor state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    imageUrl: STORE_IMAGES.earbuds as string,
    isActive: true,
    displayOrder: 9,
  });
  const [savingCategory, setSavingCategory] = useState(false);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [prodRes, catRes, allOrders, totalUsers] = await Promise.all([
        fetchProducts(true),
        fetchCategories(true),
        fetchAllOrdersAdmin(),
        fetchTotalCustomersCountAdmin(),
      ]);
      setAdminProducts(prodRes.products);
      setAdminCategories(catRes.categories);
      setOrders(allOrders);
      setCustomerCount(totalUsers);
    } catch (err) {
      console.error('Admin data load failed:', err);
      showToast('Failed to load live Firestore admin metrics.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      void loadAdminData();
    }
  }, [authLoading, isAdmin, loadAdminData]);

  const totalSales = useMemo(
    () =>
      orders
        .filter((o) => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-sm text-[#777F7B]">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="bg-white border border-[#E8ECE8] rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#202A27]">
            Administrator Access Required
          </h1>
          <p className="text-sm text-[#777F7B] leading-relaxed">
            This management console is restricted to verified GIFTLY administrators. Customer
            accounts cannot access store management tools.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-sm font-medium"
            >
              Return to Store
            </Link>
            {!user && (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg border border-[#E8ECE8] text-sm font-medium text-[#202A27]"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const openNewProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      categoryId: adminCategories[0]?.id || 'electronics',
      sku: `GL-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setTagsInput('');
    setShowProductForm(true);
  };

  const openEditProductForm = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      categoryId: p.categoryId,
      price: p.price,
      originalPrice: p.originalPrice,
      imageUrl: p.imageUrl,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
      isGiftable: p.isGiftable,
      recipients: p.recipients,
      occasions: p.occasions,
      interests: p.interests,
      giftStyles: p.giftStyles,
      tags: p.tags,
    });
    setTagsInput(p.tags.join(', '));
    setShowProductForm(true);
  };

  const toggleArrayValue = (
    field: 'recipients' | 'occasions' | 'interests' | 'giftStyles',
    value: string
  ) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const payload: ProductUpsertPayload = { ...productForm, tags: parsedTags };

      if (editingProductId) {
        await updateProductAdmin(editingProductId, payload);
        showToast('Product updated in Firestore.', 'success');
      } else {
        await createProductAdmin(payload);
        showToast('New product added to Firestore.', 'success');
      }
      setShowProductForm(false);
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      console.error(err);
      showToast('Failed to save product. Verify fields and try again.', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    try {
      await deleteProductAdmin(productId);
      showToast(`Deleted "${name}".`, 'info');
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch {
      showToast('Failed to delete product.', 'error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCategory(true);
    try {
      await upsertCategoryAdmin({
        id: editingCategoryId ?? undefined,
        ...catForm,
      });
      showToast(editingCategoryId ? 'Category updated.' : 'Category created.', 'success');
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch {
      showToast('Failed to save category.', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryAdmin(categoryId);
      showToast('Category removed.', 'info');
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch {
      showToast('Failed to remove category.', 'error');
    }
  };

  const handleOrderStatusChange = async (
    orderId: string,
    orderStatus: OrderStatus,
    paymentStatus: PaymentStatus
  ) => {
    try {
      await updateOrderStatusAdmin(orderId, orderStatus, paymentStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId ? { ...o, orderStatus, paymentStatus } : o
        )
      );
      showToast(`Order ${orderId} updated to ${orderStatus}.`, 'success');
    } catch {
      showToast('Could not update order status.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8ECE8]">
        <div>
          <p className="text-xs font-semibold text-[#26734D]">GIFTLY Operations Console</p>
          <h1 className="font-display text-3xl font-extrabold text-[#202A27] mt-1">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isSeeding}
            onClick={async () => {
              await initializeFirestoreCatalog();
              await loadAdminData();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E8ECE8] bg-white text-xs font-semibold text-[#202A27] hover:bg-[#F8F9F7] disabled:opacity-60 cursor-pointer"
          >
            {isSeeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5 text-[#26734D]" />
            )}
            Sync / Seed Starter Catalogue
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('products');
              openNewProductForm();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#26734D] text-white text-xs font-semibold hover:bg-[#1E5C3D] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 inline-flex flex-wrap items-center gap-1 p-1 bg-[#EEF2EC] rounded-xl">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'products', label: `Products (${adminProducts.length})`, icon: Package },
          { id: 'categories', label: `Categories (${adminCategories.length})`, icon: FolderKanban },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as AdminTab)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                tab === item.id
                  ? 'bg-white text-[#202A27] shadow-sm'
                  : 'text-[#777F7B] hover:text-[#202A27]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-[#777F7B]">Loading store telemetry...</div>
      ) : (
        <div className="mt-8">
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6">
                  <div className="flex items-center justify-between text-xs font-medium text-[#777F7B] mb-2">
                    <span>Total Sales</span>
                    <IndianRupee className="w-4 h-4 text-[#26734D]" />
                  </div>
                  <p className="font-mono-num text-2xl font-bold text-[#202A27]">
                    {formatINR(totalSales)}
                  </p>
                </div>

                <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6">
                  <div className="flex items-center justify-between text-xs font-medium text-[#777F7B] mb-2">
                    <span>Total Orders</span>
                    <ShoppingCart className="w-4 h-4 text-[#26734D]" />
                  </div>
                  <p className="font-mono-num text-2xl font-bold text-[#202A27]">{orders.length}</p>
                </div>

                <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6">
                  <div className="flex items-center justify-between text-xs font-medium text-[#777F7B] mb-2">
                    <span>Active Products</span>
                    <Package className="w-4 h-4 text-[#26734D]" />
                  </div>
                  <p className="font-mono-num text-2xl font-bold text-[#202A27]">
                    {adminProducts.filter((p) => p.isActive).length}{' '}
                    <span className="text-xs font-normal text-[#777F7B]">
                      / {adminProducts.length}
                    </span>
                  </p>
                </div>

                <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6">
                  <div className="flex items-center justify-between text-xs font-medium text-[#777F7B] mb-2">
                    <span>Registered Customers</span>
                    <Users className="w-4 h-4 text-[#26734D]" />
                  </div>
                  <p className="font-mono-num text-2xl font-bold text-[#202A27]">{customerCount}</p>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E8ECE8] flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-[#202A27]">Recent Orders</h2>
                  <button
                    type="button"
                    onClick={() => setTab('orders')}
                    className="text-xs font-semibold text-[#26734D] hover:underline cursor-pointer"
                  >
                    Manage All Orders
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="p-8 text-center text-sm text-[#777F7B]">No orders recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#F8F9F7] text-xs text-[#777F7B] border-b border-[#E8ECE8]">
                        <tr>
                          <th className="px-6 py-3 font-medium">Order ID</th>
                          <th className="px-6 py-3 font-medium">Customer</th>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8ECE8]">
                        {orders.slice(0, 6).map((o) => (
                          <tr key={o.orderId}>
                            <td className="px-6 py-3.5 font-mono-num font-semibold text-[#202A27]">
                              {o.orderId}
                            </td>
                            <td className="px-6 py-3.5 text-[#202A27]">{o.customerDetails.name}</td>
                            <td className="px-6 py-3.5 text-[#777F7B]">{formatDateIN(o.createdAt)}</td>
                            <td className="px-6 py-3.5 font-medium text-[#26734D]">
                              {o.orderStatus}
                            </td>
                            <td className="px-6 py-3.5 font-mono-num font-semibold text-right text-[#202A27]">
                              {formatINR(o.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {tab === 'products' && (
            <div className="space-y-6">
              {showProductForm && (
                <form
                  onSubmit={handleSaveProduct}
                  className="bg-white border border-[#E8ECE8] rounded-2xl p-6 sm:p-8 space-y-6"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#E8ECE8]">
                    <h2 className="font-display text-lg font-bold text-[#202A27]">
                      {editingProductId ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="p-1.5 text-[#777F7B] hover:text-[#202A27] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Category *</label>
                      <select
                        value={productForm.categoryId}
                        onChange={(e) =>
                          setProductForm({ ...productForm, categoryId: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      >
                        {adminCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Selling Price (INR) *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({ ...productForm, price: Number(e.target.value) })
                        }
                        className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Original MRP Price (INR) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={productForm.originalPrice}
                        onChange={(e) =>
                          setProductForm({ ...productForm, originalPrice: Number(e.target.value) })
                        }
                        className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Stock Quantity *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={productForm.stockQuantity}
                        onChange={(e) =>
                          setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })
                        }
                        className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">SKU *</label>
                      <input
                        type="text"
                        required
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1">
                        Product Image URL *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.imageUrl}
                        onChange={(e) =>
                          setProductForm({ ...productForm, imageUrl: e.target.value })
                        }
                        placeholder="https://... or /src/assets/images/..."
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Short Description *</label>
                      <input
                        type="text"
                        required
                        maxLength={300}
                        value={productForm.shortDescription}
                        onChange={(e) =>
                          setProductForm({ ...productForm, shortDescription: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Full Description *</label>
                      <textarea
                        rows={3}
                        required
                        maxLength={2500}
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({ ...productForm, description: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1">
                        Search Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="earbuds, bluetooth, wireless"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="flex flex-wrap gap-6 pt-2 text-sm">
                    {[
                      { key: 'isActive', label: 'Active (Visible in Store)' },
                      { key: 'isFeatured', label: 'Featured / Trending' },
                      { key: 'isNewArrival', label: 'New Arrival' },
                      { key: 'isBestSeller', label: 'Best Seller' },
                      { key: 'isGiftable', label: 'Giftable (Eligible for GiftMatch)' },
                    ].map((flag) => (
                      <label key={flag.key} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(productForm[flag.key as keyof ProductUpsertPayload])}
                          onChange={(e) =>
                            setProductForm({ ...productForm, [flag.key]: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#26734D]"
                        />
                        <span>{flag.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* GiftMatch Metadata */}
                  {productForm.isGiftable && (
                    <div className="pt-4 border-t border-[#E8ECE8] space-y-4">
                      <h3 className="font-display text-sm font-bold text-[#202A27]">
                        GiftMatch Scoring Metadata
                      </h3>

                      <div>
                        <p className="text-xs font-semibold text-[#777F7B] mb-2">Suitable Recipients</p>
                        <div className="flex flex-wrap gap-1.5">
                          {RECIPIENT_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleArrayValue('recipients', opt)}
                              className={`px-2.5 py-1 rounded-md text-xs border cursor-pointer ${
                                productForm.recipients.includes(opt)
                                  ? 'bg-[#26734D] text-white border-[#26734D]'
                                  : 'bg-[#F8F9F7] text-[#202A27] border-[#E8ECE8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#777F7B] mb-2">Suitable Occasions</p>
                        <div className="flex flex-wrap gap-1.5">
                          {OCCASION_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleArrayValue('occasions', opt)}
                              className={`px-2.5 py-1 rounded-md text-xs border cursor-pointer ${
                                productForm.occasions.includes(opt)
                                  ? 'bg-[#26734D] text-white border-[#26734D]'
                                  : 'bg-[#F8F9F7] text-[#202A27] border-[#E8ECE8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#777F7B] mb-2">Matching Interests</p>
                        <div className="flex flex-wrap gap-1.5">
                          {INTEREST_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleArrayValue('interests', opt)}
                              className={`px-2.5 py-1 rounded-md text-xs border cursor-pointer ${
                                productForm.interests.includes(opt)
                                  ? 'bg-[#26734D] text-white border-[#26734D]'
                                  : 'bg-[#F8F9F7] text-[#202A27] border-[#E8ECE8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#777F7B] mb-2">Gift Styles</p>
                        <div className="flex flex-wrap gap-1.5">
                          {GIFT_STYLE_OPTIONS.filter((s) => s !== 'Surprise Me').map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleArrayValue('giftStyles', opt)}
                              className={`px-2.5 py-1 rounded-md text-xs border cursor-pointer ${
                                productForm.giftStyles.includes(opt)
                                  ? 'bg-[#26734D] text-white border-[#26734D]'
                                  : 'bg-[#F8F9F7] text-[#202A27] border-[#E8ECE8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="px-6 py-2.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] disabled:opacity-60 cursor-pointer"
                    >
                      {savingProduct
                        ? 'Saving to Firestore...'
                        : editingProductId
                          ? 'Update Product'
                          : 'Create Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E8ECE8] text-sm font-medium text-[#777F7B] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E8ECE8] flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-[#202A27]">
                    Catalogue Products ({adminProducts.length})
                  </h2>
                  <button
                    type="button"
                    onClick={openNewProductForm}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#26734D] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Product
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#F8F9F7] text-xs text-[#777F7B] border-b border-[#E8ECE8]">
                      <tr>
                        <th className="px-5 py-3 font-medium">Product</th>
                        <th className="px-5 py-3 font-medium">Price</th>
                        <th className="px-5 py-3 font-medium">Stock</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8ECE8]">
                      {adminProducts.map((p) => (
                        <tr key={p.id}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#F1F4F0] shrink-0">
                                <SafeImage
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-[#202A27] truncate max-w-xs">
                                  {p.name}
                                </p>
                                <p className="text-xs text-[#777F7B]">
                                  {p.categoryId} · {p.sku}
                                  {p.isGiftable ? ' · Giftable' : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono-num font-semibold text-[#202A27]">
                            {formatINR(p.price)}
                          </td>
                          <td className="px-5 py-3.5 font-mono-num text-[#202A27]">
                            {p.stockQuantity}
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <span
                              className={
                                p.isActive
                                  ? 'text-[#26734D] font-semibold'
                                  : 'text-[#777F7B] font-medium'
                              }
                            >
                              {p.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditProductForm(p)}
                              aria-label={`Edit ${p.name}`}
                              className="p-2 text-[#777F7B] hover:text-[#26734D] cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteProduct(p.id, p.name)}
                              aria-label={`Delete ${p.name}`}
                              className="p-2 text-[#777F7B] hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {tab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#202A27]">
                  Manage Categories
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCatForm({
                      name: '',
                      description: '',
                      imageUrl: STORE_IMAGES.earbuds,
                      isActive: true,
                      displayOrder: adminCategories.length + 1,
                    });
                    setShowCategoryForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#26734D] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>

              {showCategoryForm && (
                <form
                  onSubmit={handleSaveCategory}
                  className="bg-white border border-[#E8ECE8] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <input
                    type="text"
                    required
                    placeholder="Category Name"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Display Order"
                    value={catForm.displayOrder}
                    onChange={(e) =>
                      setCatForm({ ...catForm, displayOrder: Number(e.target.value) })
                    }
                    className="px-3.5 py-2.5 text-sm font-mono-num bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Category Image URL"
                    value={catForm.imageUrl}
                    onChange={(e) => setCatForm({ ...catForm, imageUrl: e.target.value })}
                    className="sm:col-span-2 px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Short Description"
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    className="sm:col-span-2 px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl"
                  />
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catForm.isActive}
                      onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                      className="w-4 h-4 accent-[#26734D]"
                    />
                    <span>Active</span>
                  </label>
                  <div className="sm:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-xs font-semibold cursor-pointer"
                    >
                      {savingCategory ? 'Saving...' : 'Save Category'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="px-4 py-2.5 rounded-lg border border-[#E8ECE8] text-xs font-semibold text-[#777F7B] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {adminCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white border border-[#E8ECE8] rounded-2xl p-5 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-bold text-[#202A27] truncate">{cat.name}</p>
                      <p className="text-xs text-[#777F7B] mt-1 line-clamp-2">{cat.description}</p>
                      <p className="text-[11px] font-mono-num text-[#26734D] mt-2">
                        Order #{cat.displayOrder} · {cat.isActive ? 'Active' : 'Hidden'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(cat.id);
                          setCatForm({
                            name: cat.name,
                            description: cat.description,
                            imageUrl: cat.imageUrl,
                            isActive: cat.isActive,
                            displayOrder: cat.displayOrder,
                          });
                          setShowCategoryForm(true);
                        }}
                        className="p-1.5 text-[#777F7B] hover:text-[#26734D] cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(cat.id)}
                        className="p-1.5 text-[#777F7B] hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white border border-[#E8ECE8] rounded-2xl p-10 text-center text-sm text-[#777F7B]">
                  No orders have been placed yet.
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.orderId}
                    className="bg-white border border-[#E8ECE8] rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8ECE8]">
                      <div>
                        <p className="font-mono-num font-bold text-base text-[#202A27]">
                          {order.orderId}
                        </p>
                        <p className="text-xs text-[#777F7B] mt-0.5">
                          {formatDateIN(order.createdAt)} · {order.customerDetails.name} (
                          {order.customerDetails.mobile}) · {order.customerDetails.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          aria-label={`Update status for ${order.orderId}`}
                          value={order.orderStatus}
                          onChange={(e) =>
                            void handleOrderStatusChange(
                              order.orderId,
                              e.target.value as OrderStatus,
                              order.paymentStatus
                            )
                          }
                          className="px-3 py-1.5 text-xs font-semibold bg-[#F8F9F7] border border-[#E8ECE8] rounded-lg text-[#202A27]"
                        >
                          {ORDER_STATUS_LIST.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label={`Update payment status for ${order.orderId}`}
                          value={order.paymentStatus}
                          onChange={(e) =>
                            void handleOrderStatusChange(
                              order.orderId,
                              order.orderStatus,
                              e.target.value as PaymentStatus
                            )
                          }
                          className="px-3 py-1.5 text-xs font-medium bg-[#F8F9F7] border border-[#E8ECE8] rounded-lg text-[#777F7B]"
                        >
                          <option value="Pending">Payment: Pending</option>
                          <option value="Paid (Demo)">Payment: Paid (Demo)</option>
                          <option value="Refunded">Payment: Refunded</option>
                        </select>

                        <span className="font-mono-num text-base font-bold text-[#26734D]">
                          {formatINR(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#202A27]">Purchased Items</p>
                        {order.items.map((item) => (
                          <p key={item.productId} className="text-[#777F7B]">
                            {item.name} × {item.quantity} ({formatINR(item.lineTotal)})
                          </p>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-[#202A27]">Delivery Destination</p>
                        <p className="text-[#777F7B]">
                          {order.deliveryAddress.address}, {order.deliveryAddress.city},{' '}
                          {order.deliveryAddress.state} – {order.deliveryAddress.pinCode}
                        </p>
                        <p className="text-[#777F7B]">Payment Method: {order.paymentMethod}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
