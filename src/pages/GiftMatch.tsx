import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { EmptyState } from '../components/common/Feedback';
import { SafeImage } from '../components/common/SafeImage';
import { useStore } from '../context/StoreContext';
import { getGiftMatchRecommendations } from '../services/giftMatchService';
import {
  BUDGET_OPTIONS,
  GIFT_STYLE_OPTIONS,
  INTEREST_OPTIONS,
  OCCASION_OPTIONS,
  RECIPIENT_OPTIONS,
  type GiftMatchBudgetId,
  type GiftMatchInput,
  type GiftMatchInterest,
  type GiftMatchOccasion,
  type GiftMatchRecipient,
  type GiftMatchRecommendation,
  type GiftMatchStyle,
} from '../types/giftmatch';
import { formatINR } from '../utils/formatCurrency';

const STEPS = [
  { id: 1, title: 'Recipient', question: 'Who are you shopping for?', subtitle: 'Optional — choose the relationship to prioritize the best fit.' },
  { id: 2, title: 'Occasion', question: "What's the occasion?", subtitle: 'Optional — helps tailor recommendations to the moment.' },
  { id: 3, title: 'Interests', question: 'What does this person like?', subtitle: 'Select one or more interests (or skip if unsure).' },
  { id: 4, title: 'Budget', question: 'What is your comfortable budget?', subtitle: 'We score items inside your range and within 10% above.' },
  { id: 5, title: 'Gift Style', question: 'What kind of gift feels right?', subtitle: 'Choose a vibe or let us surprise you.' },
] as const;

export function GiftMatch() {
  const { products, addToCart, getCategoryName } = useStore();

  const [step, setStep] = useState(1);
  const [input, setInput] = useState<GiftMatchInput>({
    recipient: '',
    occasion: '',
    interests: [],
    budgetId: '',
    giftStyle: '',
  });
  const [results, setResults] = useState<GiftMatchRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: GiftMatchInterest) => {
    setInput((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleFindMatches = async () => {
    setLoading(true);
    try {
      const recs = await getGiftMatchRecommendations(input, products);
      setResults(recs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setStep(1);
    setInput({
      recipient: '',
      occasion: '',
      interests: [],
      budgetId: '',
      giftStyle: '',
    });
  };

  const progressPct = Math.round((step / STEPS.length) * 100);
  const currentStep = STEPS[step - 1];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="max-w-2xl mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C86428] mb-2">
          <Sparkles className="w-4 h-4 text-[#F28C52]" />
          <span>GiftMatch — Find a gift they&apos;ll actually love.</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#202A27] leading-tight">
          {results ? 'Your Curated GiftMatch Results' : 'Smart Gift Discovery in 5 Quick Steps'}
        </h1>
        <p className="text-sm sm:text-base text-[#777F7B] mt-2 leading-relaxed">
          {results
            ? 'Ranked transparently from our live GIFTLY catalogue using your selected preferences.'
            : 'Every step is optional. Our transparent rule-based scoring engine matches live store products and explains why each item fits.'}
        </p>
      </div>

      {/* RESULTS VIEW */}
      {results !== null ? (
        <div className="space-y-8">
          {/* Selected Criteria Bar */}
          <div className="bg-white border border-[#E8ECE8] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-[#777F7B] flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-[#202A27]">Preferences:</span>
              {input.recipient && <span>For {input.recipient}</span>}
              {input.occasion && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{input.occasion}</span>
                </>
              )}
              {input.interests.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{input.interests.join(', ')}</span>
                </>
              )}
              {input.budgetId && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{BUDGET_OPTIONS.find((b) => b.id === input.budgetId)?.label}</span>
                </>
              )}
              {input.giftStyle && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{input.giftStyle}</span>
                </>
              )}
              {!input.recipient &&
                !input.occasion &&
                input.interests.length === 0 &&
                !input.budgetId &&
                !input.giftStyle && <span>All giftable picks</span>}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setResults(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8ECE8] bg-[#F8F9F7] text-xs font-semibold text-[#202A27] hover:bg-[#EEF2EC] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Modify Preferences
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8ECE8] text-xs font-semibold text-[#777F7B] hover:text-[#202A27] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Over
              </button>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="No close matches found for that exact combination"
              description="Try widening your budget bracket, selecting fewer constraints, or exploring our full GIFTLY shop."
              actionLabel="Adjust Preferences"
              onAction={() => setResults(null)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((rec) => (
                <article
                  key={rec.product.id}
                  className="bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link
                    to={`/product/${rec.product.slug}`}
                    className="block aspect-[4/3] bg-[#F1F4F0] overflow-hidden"
                  >
                    <SafeImage
                      src={rec.product.imageUrl}
                      alt={rec.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Match Score & Metadata Header */}
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E8ECE8]">
                      <div>
                        <span className="font-mono-num text-sm font-bold text-[#26734D]">
                          {rec.score}/100 MATCH
                        </span>
                        <p className="text-xs text-[#777F7B]">
                          {getCategoryName(rec.product.categoryId)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono-num text-xs font-semibold text-[#202A27]">
                        <Star className="w-3.5 h-3.5 text-[#F28C52]" fill="currentColor" />
                        {rec.product.ratingAverage.toFixed(1)}
                      </span>
                    </div>

                    <Link
                      to={`/product/${rec.product.slug}`}
                      className="font-display text-base font-bold text-[#202A27] hover:text-[#26734D] transition-colors line-clamp-2"
                    >
                      {rec.product.name}
                    </Link>

                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-mono-num text-lg font-bold text-[#202A27]">
                        {formatINR(rec.product.price)}
                      </span>
                      {rec.product.originalPrice > rec.product.price && (
                        <span className="font-mono-num text-xs text-[#777F7B] line-through">
                          {formatINR(rec.product.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Transparent Why This Match Explanations */}
                    <div className="mt-4 pt-3 border-t border-[#E8ECE8] flex-1">
                      <p className="text-xs font-semibold text-[#202A27] mb-2">Why this match?</p>
                      <ul className="space-y-1.5 text-xs text-[#777F7B]">
                        {rec.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#26734D] shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <Link
                        to={`/product/${rec.product.slug}`}
                        className="text-center px-3 py-2.5 rounded-lg border border-[#E8ECE8] text-xs font-semibold text-[#202A27] hover:bg-[#F8F9F7] transition-colors whitespace-nowrap"
                      >
                        View Product
                      </Link>
                      <button
                        type="button"
                        onClick={() => addToCart(rec.product.id, 1, true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#26734D] text-white text-xs font-semibold hover:bg-[#1E5C3D] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* WIZARD VIEW */
        <div className="max-w-3xl bg-white border border-[#E8ECE8] rounded-3xl p-6 sm:p-10 space-y-8">
          {/* Progress Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-[#777F7B]">
              <span>
                Step <span className="font-mono-num text-[#202A27] font-semibold">{step}</span> of{' '}
                <span className="font-mono-num">{STEPS.length}</span> · {currentStep.title}
              </span>
              <span className="font-mono-num text-[#26734D] font-semibold">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#EEF2EC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#26734D] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Step Heading */}
          <div>
            <h2 className="font-display text-2xl font-bold text-[#202A27]">
              {currentStep.question}
            </h2>
            <p className="text-sm text-[#777F7B] mt-1">{currentStep.subtitle}</p>
          </div>

          {/* Step 1: Recipient */}
          {step === 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {RECIPIENT_OPTIONS.map((option) => {
                const selected = input.recipient === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setInput((prev) => ({
                        ...prev,
                        recipient: selected ? '' : (option as GiftMatchRecipient),
                      }))
                    }
                    className={`px-4 py-3.5 rounded-xl border text-sm font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                      selected
                        ? 'border-[#26734D] bg-[#26734D]/8 text-[#202A27]'
                        : 'border-[#E8ECE8] bg-[#F8F9F7] text-[#202A27] hover:border-[#26734D]/40'
                    }`}
                  >
                    <span>{option}</span>
                    {selected && <Check className="w-4 h-4 text-[#26734D]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Occasion */}
          {step === 2 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {OCCASION_OPTIONS.map((option) => {
                const selected = input.occasion === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setInput((prev) => ({
                        ...prev,
                        occasion: selected ? '' : (option as GiftMatchOccasion),
                      }))
                    }
                    className={`px-4 py-3.5 rounded-xl border text-sm font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                      selected
                        ? 'border-[#26734D] bg-[#26734D]/8 text-[#202A27]'
                        : 'border-[#E8ECE8] bg-[#F8F9F7] text-[#202A27] hover:border-[#26734D]/40'
                    }`}
                  >
                    <span>{option}</span>
                    {selected && <Check className="w-4 h-4 text-[#26734D]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 3: Interests (Multi-Select) */}
          {step === 3 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = input.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-3.5 rounded-xl border text-sm font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                      selected
                        ? 'border-[#26734D] bg-[#26734D]/8 text-[#202A27]'
                        : 'border-[#E8ECE8] bg-[#F8F9F7] text-[#202A27] hover:border-[#26734D]/40'
                    }`}
                  >
                    <span>{interest}</span>
                    {selected && <Check className="w-4 h-4 text-[#26734D]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 4: Budget */}
          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUDGET_OPTIONS.map((budget) => {
                const selected = input.budgetId === budget.id;
                return (
                  <button
                    key={budget.id}
                    type="button"
                    onClick={() =>
                      setInput((prev) => ({
                        ...prev,
                        budgetId: selected ? '' : (budget.id as GiftMatchBudgetId),
                      }))
                    }
                    className={`px-5 py-4 rounded-xl border text-sm font-semibold font-mono-num text-left flex items-center justify-between transition-all cursor-pointer ${
                      selected
                        ? 'border-[#26734D] bg-[#26734D]/8 text-[#202A27]'
                        : 'border-[#E8ECE8] bg-[#F8F9F7] text-[#202A27] hover:border-[#26734D]/40'
                    }`}
                  >
                    <span>{budget.label}</span>
                    {selected && <Check className="w-4 h-4 text-[#26734D]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 5: Gift Style */}
          {step === 5 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GIFT_STYLE_OPTIONS.map((style) => {
                const selected = input.giftStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      setInput((prev) => ({
                        ...prev,
                        giftStyle: selected ? '' : (style as GiftMatchStyle),
                      }))
                    }
                    className={`px-4 py-3.5 rounded-xl border text-sm font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                      selected
                        ? 'border-[#26734D] bg-[#26734D]/8 text-[#202A27]'
                        : 'border-[#E8ECE8] bg-[#F8F9F7] text-[#202A27] hover:border-[#26734D]/40'
                    }`}
                  >
                    <span>{style}</span>
                    {selected && <Check className="w-4 h-4 text-[#26734D]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-6 border-t border-[#E8ECE8] flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8ECE8] text-sm font-medium text-[#202A27] hover:bg-[#F8F9F7] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {step < STEPS.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                    className="text-xs font-medium text-[#777F7B] hover:text-[#202A27] px-2 py-2 cursor-pointer"
                  >
                    Skip step
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] transition-colors cursor-pointer"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleFindMatches()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {loading ? 'Scoring Catalogue...' : 'Find My Match'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
