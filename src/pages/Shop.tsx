import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { EmptyState, ProductCardSkeleton } from '../components/common/Feedback';
import { ProductCard } from '../components/products/ProductCard';
import { useStore } from '../context/StoreContext';
import type { ProductSortOption } from '../types/product';

interface ShopProps {
  mode?: 'shop' | 'category' | 'deals' | 'search';
}

const PRICE_RANGES = [
  { id: 'all', label: 'All Prices', min: null, max: null },
  { id: 'under_500', label: 'Under ₹500', min: 0, max: 500 },
  { id: '500_1000', label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { id: '1000_2000', label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
  { id: '2000_5000', label: '₹2,000 – ₹5,000', min: 2000, max: 5000 },
  { id: 'above_5000', label: 'Above ₹5,000', min: 5000, max: null },
] as const;

export function Shop({ mode = 'shop' }: ShopProps) {
  const { slug: categorySlug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, products, catalogLoading, getCategoryName } = useStore();

  const initialQuery = searchParams.get('q') ?? '';
  const initialSort = (searchParams.get('sort') as ProductSortOption) || 'popularity';

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.slug === categorySlug || c.id === categorySlug),
    [categories, categorySlug]
  );

  const [searchText, setSearchText] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    mode === 'category' && activeCategoryObj ? activeCategoryObj.id : 'all'
  );
  const [priceRangeId, setPriceRangeId] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<ProductSortOption>(initialSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL ?q= when navigating from navbar search
  const urlQuery = searchParams.get('q') ?? '';
  React.useEffect(() => {
    if (mode === 'search') {
      setSearchText(urlQuery);
    }
  }, [urlQuery, mode]);

  React.useEffect(() => {
    if (mode === 'category' && activeCategoryObj) {
      setSelectedCategory(activeCategoryObj.id);
    } else if (mode !== 'category') {
      setSelectedCategory('all');
    }
  }, [mode, activeCategoryObj]);

  const effectiveCategory =
    mode === 'category' && activeCategoryObj ? activeCategoryObj.id : selectedCategory;

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const range = PRICE_RANGES.find((r) => r.id === priceRangeId) ?? PRICE_RANGES[0];

    let list = products.filter((p) => {
      if (mode === 'deals' && p.discountPercentage < 25) return false;
      if (effectiveCategory !== 'all' && p.categoryId !== effectiveCategory) return false;
      if (inStockOnly && p.stockQuantity <= 0) return false;
      if (minRating > 0 && p.ratingAverage < minRating) return false;
      if (range.min !== null && p.price < range.min) return false;
      if (range.max !== null && p.price > range.max) return false;
      if (q) {
        const catName = getCategoryName(p.categoryId).toLowerCase();
        const matchesText =
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          catName.includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesText) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount;
        case 'newest':
          return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0) ||
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        case 'popularity':
        default:
          return b.popularityScore - a.popularityScore;
      }
    });

    return list;
  }, [
    products,
    mode,
    effectiveCategory,
    inStockOnly,
    minRating,
    priceRangeId,
    searchText,
    sortBy,
    getCategoryName,
  ]);

  const resetFilters = () => {
    setSearchText('');
    if (mode !== 'category') setSelectedCategory('all');
    setPriceRangeId('all');
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('popularity');
    if (mode === 'search') {
      setSearchParams({});
    }
  };

  const pageHeading =
    mode === 'category'
      ? activeCategoryObj?.name ?? 'Category'
      : mode === 'deals'
        ? 'Ongoing Deals & Markdowns'
        : mode === 'search'
          ? searchText.trim()
            ? `Search Results for "${searchText.trim()}"`
            : 'Search Catalogue'
          : 'Shop All Products';

  const pageSubheading =
    mode === 'category'
      ? activeCategoryObj?.description ?? 'Explore curated products in this category.'
      : mode === 'deals'
        ? 'Direct savings of 25% or more across everyday electronics, fashion, and home essentials.'
        : 'Browse our complete live Firestore catalogue with instant filtering and sorting.';

  const FilterControls = (
    <div className="space-y-6">
      {/* Search inside catalogue */}
      <div>
        <label className="block font-display text-xs font-semibold text-[#202A27] mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[#777F7B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Name, tag, keyword..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-lg focus:outline-none focus:border-[#26734D] focus:bg-white"
          />
        </div>
      </div>

      {/* Category Filter */}
      {mode !== 'category' && (
        <div>
          <p className="font-display text-xs font-semibold text-[#202A27] mb-2">Category</p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#26734D] text-white font-medium'
                  : 'text-[#202A27] hover:bg-[#F1F4F0]'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#26734D] text-white font-medium'
                    : 'text-[#202A27] hover:bg-[#F1F4F0]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <p className="font-display text-xs font-semibold text-[#202A27] mb-2">Price Range (INR)</p>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setPriceRangeId(range.id)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                priceRangeId === range.id
                  ? 'bg-[#26734D]/12 text-[#26734D] font-semibold'
                  : 'text-[#777F7B] hover:text-[#202A27] hover:bg-[#F1F4F0]'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <p className="font-display text-xs font-semibold text-[#202A27] mb-2">Customer Rating</p>
        <div className="flex flex-wrap gap-1.5">
          {[0, 4.5, 4.7, 4.8].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                minRating === r
                  ? 'bg-[#26734D] text-white border-[#26734D]'
                  : 'bg-white text-[#202A27] border-[#E8ECE8] hover:bg-[#F8F9F7]'
              }`}
            >
              {r === 0 ? 'Any' : `${r}★ & up`}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="flex items-center gap-2.5 text-sm text-[#202A27] cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 accent-[#26734D] rounded"
          />
          <span>In stock only</span>
        </label>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full py-2 rounded-lg border border-[#E8ECE8] text-xs font-semibold text-[#777F7B] hover:text-[#202A27] hover:bg-[#F8F9F7] transition-colors cursor-pointer"
      >
        Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E8ECE8]">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#202A27]">
            {pageHeading}
          </h1>
          <p className="text-sm text-[#777F7B] mt-2 max-w-2xl">{pageSubheading}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E8ECE8] bg-white text-sm font-medium text-[#202A27] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort" className="text-xs font-medium text-[#777F7B] whitespace-nowrap">
              Sort by
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
              className="px-3 py-2 text-sm bg-white border border-[#E8ECE8] rounded-lg text-[#202A27] focus:outline-none focus:border-[#26734D]"
            >
              <option value="popularity">Popularity</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#E8ECE8] rounded-2xl p-6 sticky top-24">
          {FilterControls}
        </aside>

        {/* Mobile Filter Panel */}
        {mobileFiltersOpen && (
          <div className="lg:hidden bg-white border border-[#E8ECE8] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-sm font-bold text-[#202A27]">Filter Products</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-[#777F7B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {FilterControls}
          </div>
        )}

        {/* Results Grid */}
        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-5 text-xs text-[#777F7B]">
            <span className="font-mono-num">
              Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
            </span>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="No products match your current filters"
              description="Try broadening your price range, clearing the search keyword, or switching categories."
              actionLabel="Reset Filters"
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
