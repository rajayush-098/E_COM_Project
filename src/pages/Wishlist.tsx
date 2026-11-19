import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/common/Feedback';
import { SafeImage } from '../components/common/SafeImage';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../utils/formatCurrency';

export function Wishlist() {
  const navigate = useNavigate();
  const { wishlistIds, products, toggleWishlist, addToCart, getCategoryName } = useStore();

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#202A27]">
          Saved Wishlist ({savedProducts.length})
        </h1>
        <p className="text-sm text-[#777F7B] mt-1">
          Keep track of favourites and move them straight into your bag whenever ready.
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Tap the heart icon on any product while browsing to save it here."
          actionLabel="Explore Products"
          onAction={() => navigate('/shop')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {savedProducts.map((product) => (
            <article
              key={product.id}
              className="bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden flex flex-col"
            >
              <Link
                to={`/product/${product.slug}`}
                className="aspect-[4/3] bg-[#F1F4F0] overflow-hidden"
              >
                <SafeImage
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-xs text-[#777F7B]">{getCategoryName(product.categoryId)}</p>
                <Link
                  to={`/product/${product.slug}`}
                  className="font-display text-sm font-semibold text-[#202A27] hover:text-[#26734D] mt-1 line-clamp-2"
                >
                  {product.name}
                </Link>
                <p className="font-mono-num text-base font-bold text-[#202A27] mt-2">
                  {formatINR(product.price)}
                </p>

                <div className="mt-auto pt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={product.stockQuantity <= 0}
                    onClick={() => {
                      addToCart(product.id, 1, true);
                      toggleWishlist(product.id);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#26734D] text-white text-xs font-semibold hover:bg-[#1E5C3D] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Move to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={`Remove ${product.name}`}
                    className="p-2 rounded-lg border border-[#E8ECE8] text-[#777F7B] hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
