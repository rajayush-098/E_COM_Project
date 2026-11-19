import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '../components/common/SafeImage';
import { useStore } from '../context/StoreContext';

export function Categories() {
  const { categories, products } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#202A27]">
          Shop by Category
        </h1>
        <p className="text-base text-[#777F7B] mt-2">
          Browse every department across GIFTLY — from audio hardware and everyday leather goods to
          calm home lighting and personalized keepsakes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-[#F1F4F0] overflow-hidden">
                <SafeImage
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h2 className="font-display text-lg font-bold text-[#202A27] group-hover:text-[#26734D] transition-colors">
                    {cat.name}
                  </h2>
                  <span className="font-mono-num text-xs text-[#777F7B]">{count} items</span>
                </div>
                <p className="text-sm text-[#777F7B] leading-relaxed mb-4 flex-1">
                  {cat.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#26734D]">
                  Explore {cat.name}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
