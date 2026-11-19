import { BUDGET_OPTIONS, type GiftMatchInput, type GiftMatchRecommendation } from '../types/giftmatch';
import type { Product } from '../types/product';

const WEIGHT_RECIPIENT = 30;
const WEIGHT_OCCASION = 30;
const WEIGHT_INTERESTS = 20;
const WEIGHT_BUDGET = 20;

const RECIPIENT_LABELS: Record<string, string> = {
  Friend: 'friends',
  Boyfriend: 'a boyfriend',
  Girlfriend: 'a girlfriend',
  Brother: 'a brother',
  Sister: 'a sister',
  Father: 'a father',
  Mother: 'a mother',
  Teacher: 'a teacher or mentor',
  Colleague: 'a colleague',
  Others: 'thoughtful everyday gifting',
};

const OCCASION_LABELS: Record<string, string> = {
  Birthday: 'birthdays',
  Anniversary: 'anniversaries',
  Graduation: 'graduations',
  Wedding: 'weddings',
  Festival: 'festive celebrations',
  'Thank You': 'thank-you gestures',
  Celebration: 'milestone celebrations',
  'Just Because': 'spontaneous surprises',
};

export function runGiftMatchEngine(
  products: Product[],
  input: GiftMatchInput
): GiftMatchRecommendation[] {
  const activeGiftable = products.filter(
    (p) => p.isActive && p.isGiftable && p.stockQuantity > 0
  );

  const hasRecipient = Boolean(input.recipient);
  const hasOccasion = Boolean(input.occasion);
  const hasInterests = input.interests && input.interests.length > 0;
  const budgetConfig = input.budgetId
    ? BUDGET_OPTIONS.find((b) => b.id === input.budgetId) ?? null
    : null;
  const hasBudget = Boolean(budgetConfig);
  const hasStyle = Boolean(input.giftStyle && input.giftStyle !== 'Surprise Me');

  const maxPossibleWeight =
    (hasRecipient ? WEIGHT_RECIPIENT : 0) +
    (hasOccasion ? WEIGHT_OCCASION : 0) +
    (hasInterests ? WEIGHT_INTERESTS : 0) +
    (hasBudget ? WEIGHT_BUDGET : 0);

  const recommendations: GiftMatchRecommendation[] = [];

  for (const product of activeGiftable) {
    let recipientPoints = 0;
    let occasionPoints = 0;
    let interestPoints = 0;
    let budgetPoints = 0;
    const reasons: string[] = [];

    // 1. Recipient match (30 points)
    if (hasRecipient && input.recipient) {
      const matched =
        product.recipients.includes(input.recipient) ||
        (input.recipient === 'Others' && product.recipients.length > 0);
      if (matched) {
        recipientPoints = WEIGHT_RECIPIENT;
        reasons.push(`Suitable for ${RECIPIENT_LABELS[input.recipient] ?? input.recipient.toLowerCase()}.`);
      }
    }

    // 2. Occasion match (30 points)
    if (hasOccasion && input.occasion) {
      if (product.occasions.includes(input.occasion)) {
        occasionPoints = WEIGHT_OCCASION;
        reasons.push(`Appropriate for ${OCCASION_LABELS[input.occasion] ?? input.occasion.toLowerCase()}.`);
      }
    }

    // 3. Interests match (20 points)
    if (hasInterests) {
      const matchedInterests = input.interests.filter((interest) =>
        product.interests.includes(interest)
      );
      if (matchedInterests.length > 0) {
        // Full 20 points when matching selected interests, proportional if multiple were chosen
        const ratio = Math.min(1, matchedInterests.length / Math.min(2, input.interests.length));
        interestPoints = Math.round(WEIGHT_INTERESTS * ratio);
        const formatted = matchedInterests.map((i) => i.toLowerCase()).join(' & ');
        reasons.push(`Matches ${formatted} interests.`);
      }
    }

    // 4. Budget match (20 points within range, 10 points up to +10% above max, 0 beyond)
    if (hasBudget && budgetConfig) {
      const { min, max } = budgetConfig;
      if (max === null) {
        if (product.price >= min) {
          budgetPoints = WEIGHT_BUDGET;
          reasons.push(`Fits your ${budgetConfig.label} budget.`);
        } else if (product.price >= min * 0.85) {
          budgetPoints = 10;
          reasons.push(`Close to your ${budgetConfig.label} budget tier.`);
        }
      } else {
        if (product.price >= min && product.price <= max) {
          budgetPoints = WEIGHT_BUDGET;
          reasons.push(`Fits your selected ${budgetConfig.label} budget.`);
        } else if (product.price > max && product.price <= max * 1.1) {
          budgetPoints = 10;
          reasons.push(`Just within 10% of your ${budgetConfig.label} budget.`);
        } else if (min > 0 && product.price < min && product.price >= min * 0.75) {
          budgetPoints = 10;
          reasons.push(`Great value just under your ${budgetConfig.label} range.`);
        }
      }
    }

    // 5. Gift style preference (tie-breaker & transparent explanation)
    const styleMatched =
      hasStyle && input.giftStyle ? product.giftStyles.includes(input.giftStyle) : false;
    if (styleMatched && input.giftStyle) {
      reasons.push(`Matches your ${input.giftStyle.toLowerCase()} gift preference.`);
    }

    // Normalize score over selected criteria
    let normalizedScore = 0;
    if (maxPossibleWeight > 0) {
      const earned = recipientPoints + occasionPoints + interestPoints + budgetPoints;
      normalizedScore = Math.round((earned / maxPossibleWeight) * 100);
    } else {
      // User skipped all 4 scored steps — score based on style + rating/giftability
      normalizedScore = styleMatched ? 90 : Math.min(88, Math.round(product.ratingAverage * 17));
      if (reasons.length === 0) {
        reasons.push('Highly rated across everyday GIFTLY shoppers.');
      }
    }

    // Filter out clearly irrelevant results when criteria were chosen
    if (maxPossibleWeight > 0 && normalizedScore < 35) {
      continue;
    }

    if (reasons.length === 0) {
      reasons.push('Curated versatile pick from our giftable catalog.');
    }

    recommendations.push({
      product,
      score: normalizedScore,
      reasons,
      breakdown: {
        recipientPoints,
        occasionPoints,
        interestPoints,
        budgetPoints,
        styleMatched,
      },
    });
  }

  // Sort by: 1. Highest GiftMatch score, 2. Style match, 3. Highest product rating, 4. Popularity
  recommendations.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.breakdown.styleMatched !== b.breakdown.styleMatched) {
      return a.breakdown.styleMatched ? -1 : 1;
    }
    if (b.product.ratingAverage !== a.product.ratingAverage) {
      return b.product.ratingAverage - a.product.ratingAverage;
    }
    return (b.product.popularityScore ?? 0) - (a.product.popularityScore ?? 0);
  });

  return recommendations.slice(0, 12);
}
