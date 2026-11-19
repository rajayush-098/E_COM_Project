import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PackageCheck, RotateCcw, Shield, Sparkles } from 'lucide-react';

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
      <div className="space-y-4">
        <p className="text-sm font-semibold text-[#26734D]">About GIFTLY</p>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#202A27] leading-tight">
          Everyday Shopping. Extraordinary Discoveries.
        </h1>
        <p className="text-base sm:text-lg text-[#777F7B] leading-relaxed">
          GIFTLY was built with a straightforward belief: online shopping should feel calm,
          trustworthy, and genuinely useful. Whether you are upgrading your desk setup, picking up
          skincare staples, or finding a memorable birthday present through GiftMatch, every item in
          our catalogue is vetted for lasting daily value.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6 space-y-2">
          <PackageCheck className="w-6 h-6 text-[#26734D]" />
          <h2 className="font-display text-lg font-bold text-[#202A27]">Unified Retail Catalogue</h2>
          <p className="text-sm text-[#777F7B] leading-relaxed">
            All eight categories—from electronics and fashion to stationery and stoneware—live in a
            single transparent inventory synced in real time.
          </p>
        </div>

        <div className="bg-white border border-[#E8ECE8] rounded-2xl p-6 space-y-2">
          <Sparkles className="w-6 h-6 text-[#F28C52]" />
          <h2 className="font-display text-lg font-bold text-[#202A27]">Transparent GiftMatch</h2>
          <p className="text-sm text-[#777F7B] leading-relaxed">
            When shopping for someone else, our rule-based GiftMatch engine evaluates recipient,
            occasion, interests, and INR budget with clear match explanations.
          </p>
        </div>
      </div>

      {/* Policies */}
      <div className="bg-white border border-[#E8ECE8] rounded-2xl p-8 space-y-8">
        <section id="shipping" className="space-y-2">
          <h2 className="font-display text-xl font-bold text-[#202A27]">Shipping Information</h2>
          <p className="text-sm text-[#777F7B] leading-relaxed">
            Orders ₹999 and above qualify for free standard shipping across India. Orders under ₹999
            carry a flat ₹79 delivery fee. Dispatch takes 24–48 business hours with estimated
            delivery in 3–5 business days across major cities.
          </p>
        </section>

        <section id="returns" className="pt-6 border-t border-[#E8ECE8] space-y-2">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#26734D]" />
            <h2 className="font-display text-xl font-bold text-[#202A27]">Return Policy</h2>
          </div>
          <p className="text-sm text-[#777F7B] leading-relaxed">
            Unused items in original packaging may be returned within 7 days of delivery for a full
            refund or replacement. Personalized engraved items are eligible for free replacement if
            damaged in transit.
          </p>
        </section>

        <section id="privacy" className="pt-6 border-t border-[#E8ECE8] space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#26734D]" />
            <h2 className="font-display text-xl font-bold text-[#202A27]">Privacy Policy</h2>
          </div>
          <p className="text-sm text-[#777F7B] leading-relaxed">
            Your profile, delivery addresses, and order records are isolated strictly to your
            account. GIFTLY never stores raw payment card numbers, CVVs, or banking credentials.
          </p>
        </section>

        <section id="terms" className="pt-6 border-t border-[#E8ECE8] space-y-2">
          <h2 className="font-display text-xl font-bold text-[#202A27]">Terms &amp; Conditions</h2>
          <p className="text-sm text-[#777F7B] leading-relaxed">
            All prices are listed in Indian Rupees (INR) inclusive of applicable taxes. Inventory
            quantities are reserved atomically at checkout confirmation.
          </p>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] transition-colors"
        >
          Start Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/giftmatch"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E8ECE8] bg-white text-[#202A27] text-sm font-semibold hover:bg-[#F1F4F0] transition-colors"
        >
          Try GiftMatch
        </Link>
      </div>
    </div>
  );
}
