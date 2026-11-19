import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Tag, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { ProductCardSkeleton } from '../components/common/Feedback';
import { SafeImage } from '../components/common/SafeImage';
import { ProductCard } from '../components/products/ProductCard';
import { useStore } from '../context/StoreContext';
import { STORE_IMAGES } from '../data/catalogSeed';

export function Home() {
  const { categories, products, catalogLoading } = useStore();

  const trendingProducts = useMemo(() => {
    const featured = products.filter((p) => p.isFeatured);
    return (featured.length >= 8 ? featured : products).slice(0, 8);
  }, [products]);

  const newArrivals = useMemo(() => {
    const newer = products.filter((p) => p.isNewArrival);
    return (newer.length >= 4 ? newer : products).slice(0, 4);
  }, [products]);

  const bestSellers = useMemo(() => {
    const best = [...products]
      .filter((p) => p.isBestSeller)
      .sort((a, b) => b.popularityScore - a.popularityScore);
    return (best.length >= 8 ? best : [...products].sort((a, b) => b.popularityScore - a.popularityScore)).slice(0, 8);
  }, [products]);

  return (
    <div>
      {/* SECTION 2: HERO BANNER */}
      <section className="bg-white border-b border-[#E8ECE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-sm font-medium text-[#26734D]">
                Everyday Shopping. Extraordinary Discoveries.
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#202A27] leading-[1.08]">
                Everything You Love, All in One Place.
              </h1>
              <p className="text-base sm:text-lg text-[#777F7B] leading-relaxed max-w-xl">
                Discover everyday essentials, lifestyle products and something special for everyone
                — curated across electronics, fashion, home living, and daily carry.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] transition-colors whitespace-nowrap"
                >
                  Explore Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#E8ECE8] bg-[#F8F9F7] text-[#202A27] text-sm font-semibold hover:bg-[#EEF2EC] transition-colors whitespace-nowrap"
                >
                  Discover More
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] sm:min-h-[360px] rounded-2xl overflow-hidden bg-[#F1F4F0] border border-[#E8ECE8]">
                <SafeImage
                  src={STORE_IMAGES.hero}
                  alt="Everyday design essentials including headphones, table lamp, linen notebook, analog watch, and stoneware cup"
                  eager
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Subtle Trust Bar below Hero */}
          <div className="mt-10 pt-8 border-t border-[#E8ECE8] grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center gap-3 text-[#202A27]">
              <Truck className="w-5 h-5 text-[#26734D] shrink-0" />
              <span>Free pan-India delivery on orders ₹999+</span>
            </div>
            <div className="flex items-center gap-3 text-[#202A27]">
              <ShieldCheck className="w-5 h-5 text-[#26734D] shrink-0" />
              <span>Cash on Delivery & verified checkout</span>
            </div>
            <div className="flex items-center gap-3 text-[#202A27]">
              <RotateCcw className="w-5 h-5 text-[#26734D] shrink-0" />
              <span>Hassle-free 7-day returns on every order</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SHOP BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#202A27]">
              Shop by Category
            </h2>
            <p className="text-sm text-[#777F7B] mt-1">
              Explore thoughtfully curated essentials across 8 everyday departments.
            </p>
          </div>
          <Link
            to="/categories"
            className="text-sm font-semibold text-[#26734D] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            All Categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-[#F1F4F0] overflow-hidden">
                <SafeImage
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-3.5 sm:p-4">
                <h3 className="font-display text-sm sm:text-[15px] font-semibold text-[#202A27] group-hover:text-[#26734D] transition-colors truncate">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#777F7B] mt-0.5 line-clamp-1">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: TRENDING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#202A27]">
              Trending Products
            </h2>
            <p className="text-sm text-[#777F7B] mt-1">
              Popular everyday upgrades customers are adding to their bags right now.
            </p>
          </div>
          <Link
            to="/shop"
            className="text-sm font-semibold text-[#26734D] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {catalogLoading
            ? Array.from({ length: 8 }).map((_, idx) => <ProductCardSkeleton key={idx} />)
            : trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </section>

      {/* SECTION 5: SPECIAL OFFERS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-[#202A27] text-white rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#F28C52]">
              <Tag className="w-4 h-4" />
              <span>Season Savings · Up to 40% Off</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
              Save More on Everyday Tech, Desk Gear & Home Living.
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Enjoy direct catalog markdowns across wireless audio, watches, stoneware, and
              commuter essentials — plus free shipping on orders ₹999 and up.
            </p>
          </div>
          <Link
            to="/deals"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#202A27] text-sm font-semibold hover:bg-[#F1F4F0] transition-colors whitespace-nowrap shrink-0"
          >
            Shop Ongoing Deals
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* SECTION 6: NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#202A27]">
              New Arrivals
            </h2>
            <p className="text-sm text-[#777F7B] mt-1">
              Fresh additions recently stocked across our studio catalogue.
            </p>
          </div>
          <Link
            to="/shop?sort=newest"
            className="text-sm font-semibold text-[#26734D] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            Browse Newest
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {catalogLoading
            ? Array.from({ length: 4 }).map((_, idx) => <ProductCardSkeleton key={idx} />)
            : newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </section>

      {/* SECTION 7: GIFTMATCH PROMOTIONAL SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-white border border-[#E8ECE8] rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C86428]">
              <Sparkles className="w-4 h-4 text-[#F28C52]" />
              <span>GiftMatch — Smart Product Discovery</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#202A27] leading-tight">
              Shopping for Someone Special?
            </h2>
            <p className="text-base text-[#777F7B] leading-relaxed max-w-xl">
              Finding the perfect present doesn&apos;t have to be difficult. Tell GiftMatch who
              you&apos;re shopping for, the occasion, their interests, and your budget — our
              transparent scoring engine matches live catalogue products and explains why each fits.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/giftmatch"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] transition-colors whitespace-nowrap"
              >
                Try GiftMatch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs text-[#777F7B]">
                5 quick steps · Transparent 100-point match breakdown
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#F1F4F0] min-h-[260px]">
            <SafeImage
              src={STORE_IMAGES.giftmatch}
              alt="Curated everyday objects including brass pen, ceramic vessel, leather cardholder, and botanical candle"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* SECTION 8: BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#202A27]">
              Best Sellers
            </h2>
            <p className="text-sm text-[#777F7B] mt-1">
              Highest-rated favourites across all categories.
            </p>
          </div>
          <Link
            to="/shop?sort=rating"
            className="text-sm font-semibold text-[#26734D] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            Top Rated
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {catalogLoading
            ? Array.from({ length: 8 }).map((_, idx) => <ProductCardSkeleton key={idx} />)
            : bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </section>
    </div>
  );
}
