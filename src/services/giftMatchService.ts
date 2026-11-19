import type { GiftMatchInput, GiftMatchRecommendation } from '../types/giftmatch';
import type { Product } from '../types/product';
import { runGiftMatchEngine } from '../utils/giftMatchEngine';

export async function getGiftMatchRecommendations(
  input: GiftMatchInput,
  products: Product[]
): Promise<GiftMatchRecommendation[]> {
  try {
    const res = await fetch('/api/giftmatch/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, products }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.recommendations)) {
        return data.recommendations as GiftMatchRecommendation[];
      }
    }
  } catch {
    // Graceful fallback to identical deterministic engine if network hiccups
  }
  return runGiftMatchEngine(products, input);
}
