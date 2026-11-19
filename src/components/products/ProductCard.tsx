import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { Product } from '../../types/product';
import { formatINR } from '../../utils/formatCurrency';
import { SafeImage } from '../common/SafeImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isWishlisted, toggleWishlist, getCategoryName } = useStore();
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stockQuantity <= 0;

  return (
    <article className="group bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Product Photo */}
      <div className="relative aspect-[4/3] bg-[#F1F4F0] overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <SafeImage
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Wishlist Icon Toggle */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm border border-[#E8ECE8] transition-colors cursor-pointer ${
            wishlisted ? 'text-[#D26A2E]' : 'text-[#777F7B] hover:text-[#202A27]'
          }`}
        >
          <Heart className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Clean unboxed inline metadata (no pill clusters) */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#777F7B] mb-1.5">
          <span className="truncate">{getCategoryName(product.categoryId)}</span>
          <span className="inline-flex items-center gap-1 shrink-0 font-mono-num text-[#202A27]">
            <Star className="w-3.5 h-3.5 text-[#F28C52]" fill="currentColor" />
            {product.ratingAverage.toFixed(1)}
          </span>
        </div>

        <Link
          to={`/product/${product.slug}`}
          className="font-display text-[15px] font-semibold text-[#202A27] hover:text-[#26734D] transition-colors line-clamp-2 leading-snug mb-2"
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-2 space-y-3">
          {/* Pricing row */}
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
            <span className="font-mono-num text-base font-bold text-[#202A27]">
              {formatINR(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <>
                <span className="font-mono-num text-xs text-[#777F7B] line-through">
                  {formatINR(product.originalPrice)}
                </span>
                <span className="font-mono-num text-xs font-semibold text-[#26734D]">
                  {product.discountPercentage}% off
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => addToCart(product.id, 1, true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#26734D] text-white text-xs sm:text-sm font-medium hover:bg-[#1E5C3D] disabled:bg-[#E8ECE8] disabled:text-[#777F7B] transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <Link
              to={`/product/${product.slug}`}
              className="px-3 py-2 rounded-lg border border-[#E8ECE8] text-xs sm:text-sm font-medium text-[#202A27] hover:bg-[#F8F9F7] transition-colors whitespace-nowrap shrink-0"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
