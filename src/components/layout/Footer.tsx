import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E8ECE8] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link
              to="/"
              className="font-display text-xl font-extrabold tracking-tight text-[#202A27]"
            >
              GIFTLY
            </Link>
            <p className="text-sm text-[#777F7B] leading-relaxed">
              Everyday Shopping. Extraordinary Discoveries. Curated essentials across electronics,
              home living, fashion, stationery, and thoughtful gifting with GiftMatch.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="#instagram"
                onClick={(e) => e.preventDefault()}
                aria-label="GIFTLY on Instagram"
                className="p-2 rounded-lg bg-[#F8F9F7] text-[#777F7B] hover:text-[#26734D] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                onClick={(e) => e.preventDefault()}
                aria-label="GIFTLY on X"
                className="p-2 rounded-lg bg-[#F8F9F7] text-[#777F7B] hover:text-[#26734D] transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#youtube"
                onClick={(e) => e.preventDefault()}
                aria-label="GIFTLY on YouTube"
                className="p-2 rounded-lg bg-[#F8F9F7] text-[#777F7B] hover:text-[#26734D] transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-display text-sm font-semibold text-[#202A27] mb-4">
              Shop GIFTLY
            </h3>
            <ul className="space-y-2.5 text-sm text-[#777F7B]">
              <li>
                <Link to="/shop" className="hover:text-[#26734D] transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-[#26734D] transition-colors">
                  Shop by Category
                </Link>
              </li>
              <li>
                <Link to="/deals" className="hover:text-[#26734D] transition-colors">
                  Ongoing Deals
                </Link>
              </li>
              <li>
                <Link to="/giftmatch" className="hover:text-[#C86428] transition-colors font-medium">
                  GiftMatch Discovery
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#26734D] transition-colors">
                  About GIFTLY
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-display text-sm font-semibold text-[#202A27] mb-4">
              Customer Support
            </h3>
            <ul className="space-y-2.5 text-sm text-[#777F7B]">
              <li>
                <Link to="/about#shipping" className="hover:text-[#26734D] transition-colors">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link to="/about#returns" className="hover:text-[#26734D] transition-colors">
                  7-Day Easy Return Policy
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-[#26734D] transition-colors">
                  Track Orders & Account
                </Link>
              </li>
              <li>
                <Link to="/about#privacy" className="hover:text-[#26734D] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/about#terms" className="hover:text-[#26734D] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-sm font-semibold text-[#202A27] mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm text-[#777F7B]">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 mt-0.5 text-[#26734D] shrink-0" />
                <span>support@giftlystore.in</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 mt-0.5 text-[#26734D] shrink-0" />
                <span>+91 80 4120 9800 (Mon–Sat, 9 AM – 7 PM IST)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-[#26734D] shrink-0" />
                <span>Indiranagar 100 Feet Road, Bengaluru, Karnataka 560038</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E8ECE8] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777F7B]">
          <p>© {new Date().getFullYear()} GIFTLY Retail Pvt. Ltd. All rights reserved.</p>
          <p>Free delivery across India on orders ₹999 and above · Cash on Delivery available</p>
        </div>
      </div>
    </footer>
  );
}
