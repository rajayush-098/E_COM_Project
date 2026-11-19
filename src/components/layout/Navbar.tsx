import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

const RECENT_SEARCHES_KEY = 'giftly_recent_searches_v1';

export function Navbar() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { cartCount, wishlistIds, products, openCartDrawer } = useStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      return raw ? JSON.parse(raw) : ['Wireless Earbuds', 'Table Lamp', 'Leather Wallet'];
    } catch {
      return ['Wireless Earbuds', 'Table Lamp', 'Leather Wallet'];
    }
  });

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const suggestions = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            p.tags.some((t) => t.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent, overrideTerm?: string) => {
    e.preventDefault();
    const term = (overrideTerm ?? searchQuery).trim();
    if (!term) return;
    const nextRecent = [term, ...recentSearches.filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    setRecentSearches(nextRecent);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecent));
    } catch {
      // Ignore
    }
    setSearchOpen(false);
    setMobileOpen(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
      isActive
        ? 'text-[#202A27] border-[#26734D]'
        : 'text-[#777F7B] border-transparent hover:text-[#202A27]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8ECE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden p-2 -ml-2 text-[#202A27] hover:bg-[#F1F4F0] rounded-lg transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link
            to="/"
            className="font-display text-xl font-extrabold tracking-tight text-[#202A27] whitespace-nowrap shrink-0"
          >
            GIFTLY
          </Link>
        </div>

        {/* Zone 2: Clean Single-Line Navigation */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/shop" className={navLinkClass}>
            Shop
          </NavLink>
          <NavLink to="/categories" className={navLinkClass}>
            Categories
          </NavLink>
          <NavLink to="/deals" className={navLinkClass}>
            Deals
          </NavLink>
          <NavLink
            to="/giftmatch"
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                isActive
                  ? 'text-[#D26A2E] border-[#F28C52]'
                  : 'text-[#C86428] border-transparent hover:text-[#A94E18]'
              }`
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F28C52]" />
            GiftMatch
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>

        {/* Zone 3: Search + Wishlist + Account + Cart */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div ref={searchRef} className="relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-[#777F7B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search products..."
                aria-label="Search products"
                className="w-44 xl:w-60 pl-9 pr-3 py-1.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-lg text-[#202A27] placeholder:text-[#777F7B] focus:outline-none focus:border-[#26734D] focus:bg-white transition-colors"
              />
            </form>

            {searchOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E8ECE8] rounded-xl shadow-lg p-3 z-50">
                {searchQuery.trim() ? (
                  suggestions.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[#777F7B] px-2 pb-1">Matching products</p>
                      {suggestions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                            navigate(`/product/${p.slug}`);
                          }}
                          className="w-full text-left px-2 py-2 rounded-lg hover:bg-[#F8F9F7] flex items-center justify-between gap-2 text-sm cursor-pointer"
                        >
                          <span className="truncate text-[#202A27] font-medium">{p.name}</span>
                          <span className="font-mono-num text-xs text-[#26734D] shrink-0">
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={(e) => handleSearchSubmit(e)}
                        className="w-full text-left px-2 pt-2 mt-1 border-t border-[#E8ECE8] text-xs font-medium text-[#26734D] hover:underline cursor-pointer"
                      >
                        See all results for "{searchQuery.trim()}"
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#777F7B] px-2 py-2">
                      Press Enter to search for "{searchQuery.trim()}"
                    </p>
                  )
                ) : (
                  <div>
                    <p className="text-xs font-medium text-[#777F7B] px-2 pb-1.5">Recent searches</p>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={(e) => {
                            setSearchQuery(term);
                            handleSearchSubmit(e, term);
                          }}
                          className="text-xs px-2.5 py-1 rounded-md bg-[#F8F9F7] hover:bg-[#EEF2EC] text-[#202A27] transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              title="Admin Dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#26734D]/10 text-[#26734D] hover:bg-[#26734D]/15 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          <Link
            to="/wishlist"
            aria-label={`Wishlist (${wishlistIds.length} items)`}
            className="relative p-2 text-[#202A27] hover:bg-[#F1F4F0] rounded-lg transition-colors"
          >
            <Heart className="w-5 h-5" strokeWidth={1.8} />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#202A27] text-white font-mono-num text-[10px] font-semibold flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <Link
            to={user ? '/account' : '/login'}
            aria-label={user ? 'Customer Account' : 'Sign In'}
            className="p-2 text-[#202A27] hover:bg-[#F1F4F0] rounded-lg transition-colors flex items-center gap-1.5"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Account'}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-[#E8ECE8]"
              />
            ) : (
              <User className="w-5 h-5" strokeWidth={1.8} />
            )}
          </Link>

          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`Shopping bag (${cartCount} items)`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#26734D] text-white text-sm font-medium hover:bg-[#1E5C3D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Bag</span>
            <span className="font-mono-num text-xs bg-white/20 px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E8ECE8] bg-white px-4 py-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-[#777F7B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, categories, tags..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8F9F7] border border-[#E8ECE8] rounded-lg text-[#202A27]"
            />
          </form>

          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/', label: 'Home' },
              { to: '/shop', label: 'Shop' },
              { to: '/categories', label: 'Categories' },
              { to: '/deals', label: 'Deals' },
              { to: '/giftmatch', label: 'GiftMatch' },
              { to: '/about', label: 'About' },
              { to: '/wishlist', label: `Wishlist (${wishlistIds.length})` },
              { to: user ? '/account' : '/login', label: user ? 'My Account' : 'Sign In' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-medium border ${
                  item.to === '/giftmatch'
                    ? 'border-[#F28C52]/40 bg-[#F28C52]/10 text-[#C86428]'
                    : 'border-[#E8ECE8] bg-[#F8F9F7] text-[#202A27]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="col-span-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-[#26734D]/10 text-[#26734D] border border-[#26734D]/25 text-center"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
