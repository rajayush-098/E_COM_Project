import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  Gift,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { EmptyState } from '../components/common/Feedback';
import { SafeImage } from '../components/common/SafeImage';
import { ProductCard } from '../components/products/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { fetchProductReviews, submitProductReview } from '../services/productService';
import type { Review } from '../types/product';
import { formatDateIN, formatINR } from '../utils/formatCurrency';

export function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const {
    products,
    catalogLoading,
    addToCart,
    isWishlisted,
    toggleWishlist,
    getCategoryName,
    showToast,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === slug || p.id === slug),
    [products, slug]
  );

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
    if (product) {
      setSelectedImage(product.imageUrl);
    }
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    setReviewsLoading(true);
    fetchProductReviews(product.id)
      .then((list) => {
        if (!cancelled) setReviews(list);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.categoryId === product.categoryId
    );
    const others = products.filter(
      (p) => p.id !== product.id && p.categoryId !== product.categoryId
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [products, product]);

  if (catalogLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 aspect-[4/3] bg-[#EEF2EC] rounded-2xl" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-5 w-32 bg-[#EEF2EC] rounded" />
            <div className="h-9 w-3/4 bg-[#EEF2EC] rounded" />
            <div className="h-6 w-40 bg-[#EEF2EC] rounded" />
            <div className="h-24 w-full bg-[#EEF2EC] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState
          title="Product not found"
          description="The item you are looking for may have been moved or removed from our catalogue."
          actionLabel="Back to Shop"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  const galleryImages = Array.from(new Set([product.imageUrl, ...product.gallery].filter(Boolean)));
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stockQuantity <= 0;
  const maxOrderQty = Math.min(20, Math.max(1, product.stockQuantity));

  const handleBuyNow = () => {
    addToCart(product.id, quantity, false);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await signInWithGoogle();
      return;
    }
    if (reviewText.trim().length < 3) {
      showToast('Please write at least a short sentence for your review.', 'info');
      return;
    }
    setSubmittingReview(true);
    try {
      const created = await submitProductReview({
        productId: product.id,
        userId: user.uid,
        userName: user.displayName || 'Verified Shopper',
        rating: reviewRating,
        reviewText: reviewText.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setReviewText('');
      setReviewRating(5);
      showToast('Thank you! Your review has been published.', 'success');
    } catch {
      showToast('Unable to submit review. Please try again.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#777F7B] mb-6 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-[#26734D]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link to="/shop" className="hover:text-[#26734D]">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link to={`/category/${product.categoryId}`} className="hover:text-[#26734D]">
          {getCategoryName(product.categoryId)}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[#202A27] font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Split PDP Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Sticky Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-3">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#F1F4F0] border border-[#E8ECE8]">
            <SafeImage
              src={selectedImage || product.imageUrl}
              alt={product.name}
              eager
              className="w-full h-full object-cover"
            />
          </div>
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-colors ${
                    (selectedImage || product.imageUrl) === imgUrl
                      ? 'border-[#26734D]'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 bg-white border border-[#E8ECE8] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center flex-wrap gap-2 text-xs text-[#777F7B]">
              <span>{getCategoryName(product.categoryId)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">SKU {product.sku}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-[#202A27] font-mono-num font-medium">
                <Star className="w-3.5 h-3.5 text-[#F28C52]" fill="currentColor" />
                {product.ratingAverage.toFixed(1)} ({product.ratingCount + reviews.length} reviews)
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202A27] leading-tight">
              {product.name}
            </h1>

            <p className="text-sm sm:text-base text-[#777F7B] leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Pricing & Availability */}
          <div className="pt-4 border-t border-[#E8ECE8] space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="font-mono-num text-3xl font-bold text-[#202A27]">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <>
                  <span className="font-mono-num text-base text-[#777F7B] line-through">
                    {formatINR(product.originalPrice)}
                  </span>
                  <span className="font-mono-num text-sm font-semibold text-[#26734D]">
                    Save {product.discountPercentage}%
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-[#777F7B]">Inclusive of all taxes (INR)</p>

            <div className="flex items-center flex-wrap gap-4 pt-2 text-xs font-medium">
              {outOfStock ? (
                <span className="text-rose-600">Currently Out of Stock</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#26734D]">
                  <Check className="w-4 h-4" />
                  In Stock ({product.stockQuantity} available)
                </span>
              )}

              {product.isGiftable && (
                <span className="inline-flex items-center gap-1.5 text-[#C86428]">
                  <Gift className="w-3.5 h-3.5 text-[#F28C52]" />
                  Recommended for Gifting
                </span>
              )}
            </div>
          </div>

          {/* Quantity & Actions */}
          <div className="pt-4 border-t border-[#E8ECE8] space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#202A27]">Quantity</span>
              <div className="inline-flex items-center border border-[#E8ECE8] rounded-xl bg-[#F8F9F7]">
                <button
                  type="button"
                  disabled={quantity <= 1 || outOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-[#202A27] hover:bg-[#EEF2EC] disabled:opacity-40 rounded-l-xl cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-mono-num text-sm font-semibold text-[#202A27]">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxOrderQty || outOfStock}
                  onClick={() => setQuantity((q) => Math.min(maxOrderQty, q + 1))}
                  aria-label="Increase quantity"
                  className="p-2.5 text-[#202A27] hover:bg-[#EEF2EC] disabled:opacity-40 rounded-r-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => addToCart(product.id, quantity, true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] disabled:bg-[#E8ECE8] disabled:text-[#777F7B] transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                type="button"
                disabled={outOfStock}
                onClick={handleBuyNow}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#202A27] text-white text-sm font-semibold hover:bg-[#2F3E3A] disabled:bg-[#E8ECE8] disabled:text-[#777F7B] transition-colors cursor-pointer"
              >
                Buy Now
              </button>
            </div>

            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8ECE8] text-sm font-medium text-[#202A27] hover:bg-[#F8F9F7] transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${wishlisted ? 'text-[#D26A2E]' : 'text-[#777F7B]'}`}
                fill={wishlisted ? 'currentColor' : 'none'}
              />
              {wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          {/* Delivery Assurance */}
          <div className="pt-4 border-t border-[#E8ECE8] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#777F7B]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#26734D] shrink-0" />
              <span>Free delivery over ₹999 · 3–5 days</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#26734D] shrink-0" />
              <span>Cash on Delivery & 7-day returns</span>
            </div>
          </div>

          {/* Full Description & Specs */}
          <div className="pt-4 border-t border-[#E8ECE8] space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#202A27] mb-2">
                Product Overview
              </h2>
              <p className="text-sm text-[#777F7B] leading-relaxed">{product.description}</p>
            </div>

            {Object.keys(product.specs).length > 0 && (
              <div>
                <h2 className="font-display text-base font-bold text-[#202A27] mb-2">
                  Specifications
                </h2>
                <dl className="divide-y divide-[#E8ECE8] border border-[#E8ECE8] rounded-xl text-sm">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 px-4 py-2.5">
                      <dt className="text-[#777F7B] font-medium">{key}</dt>
                      <dd className="col-span-2 text-[#202A27]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-16 pt-12 border-t border-[#E8ECE8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl font-bold text-[#202A27] mb-2">
              Customer Reviews
            </h2>
            <p className="text-sm text-[#777F7B] mb-6">
              Share your experience with the {product.name}.
            </p>

            <form
              onSubmit={handleReviewSubmit}
              className="bg-white border border-[#E8ECE8] rounded-2xl p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#202A27] mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating ? 'text-[#F28C52]' : 'text-[#E8ECE8]'
                        }`}
                        fill="currentColor"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-text"
                  className="block text-xs font-semibold text-[#202A27] mb-2"
                >
                  Write a Review
                </label>
                <textarea
                  id="review-text"
                  rows={3}
                  maxLength={1000}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How is the build quality, everyday usability, or finish?"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-xl focus:outline-none focus:border-[#26734D] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-sm font-medium hover:bg-[#1E5C3D] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {!user
                  ? 'Sign In with Google to Review'
                  : submittingReview
                    ? 'Publishing...'
                    : 'Submit Review'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {reviewsLoading ? (
              <p className="text-sm text-[#777F7B]">Loading customer reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="bg-white border border-[#E8ECE8] rounded-2xl p-8 text-center">
                <p className="font-display font-semibold text-[#202A27] mb-1">
                  No written reviews yet
                </p>
                <p className="text-sm text-[#777F7B]">
                  Rated {product.ratingAverage.toFixed(1)}★ across {product.ratingCount} verified
                  ratings. Be the first to leave a detailed note.
                </p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-[#E8ECE8] rounded-2xl p-5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-[#202A27]">
                      {rev.userName}
                    </span>
                    <span className="text-xs text-[#777F7B]">{formatDateIN(rev.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#F28C52]">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-[#202A27] leading-relaxed">{rev.reviewText}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#E8ECE8]">
          <h2 className="font-display text-2xl font-bold text-[#202A27] mb-6">
            Related &amp; Similar Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
