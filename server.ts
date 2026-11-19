import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { SEED_CATEGORIES, SEED_PRODUCTS } from './src/data/catalogSeed';
import type { GiftMatchInput } from './src/types/giftmatch';
import type { CartItem, CustomerDetails, DeliveryAddress, PaymentMethod } from './src/types/order';
import type { Product } from './src/types/product';
import { runGiftMatchEngine } from './src/utils/giftMatchEngine';
import { calculateDeliveryCharge, validateCheckoutForm } from './src/utils/validation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processedIdempotencyKeys = new Map<string, { orderId: string; timestamp: number }>();

function generateUniqueOrderId(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `GFT-${y}${m}${d}-${rand}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'giftly-api', timestamp: new Date().toISOString() });
  });

  // Categories endpoint
  app.get('/api/categories', (_req, res) => {
    res.json({ categories: SEED_CATEGORIES.filter((c) => c.isActive) });
  });

  // Products search endpoint (must come before /:id)
  app.get('/api/products/search', (req, res) => {
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const categoryId = String(req.query.category ?? '').trim();

    let results = SEED_PRODUCTS.filter((p) => p.isActive);
    if (categoryId) {
      results = results.filter((p) => p.categoryId === categoryId);
    }
    if (q) {
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.categoryId.toLowerCase().includes(q)
      );
    }
    res.json({ products: results, total: results.length });
  });

  // Products list endpoint
  app.get('/api/products', (req, res) => {
    const categoryId = String(req.query.category ?? '').trim();
    const results = categoryId
      ? SEED_PRODUCTS.filter((p) => p.isActive && p.categoryId === categoryId)
      : SEED_PRODUCTS.filter((p) => p.isActive);
    res.json({ products: results, total: results.length });
  });

  // Single product endpoint
  app.get('/api/products/:id', (req, res) => {
    const found = SEED_PRODUCTS.find(
      (p) => p.id === req.params.id || p.slug === req.params.id
    );
    if (!found) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ product: found });
  });

  // Rule-Based GiftMatch Recommendation Endpoint (Deterministic TypeScript Engine, Zero AI/ML)
  app.post('/api/giftmatch/recommendations', (req, res) => {
    try {
      const body = req.body as { input?: GiftMatchInput; products?: Product[] };
      const input: GiftMatchInput = body.input ?? { interests: [] };
      const catalog: Product[] =
        Array.isArray(body.products) && body.products.length > 0
          ? body.products
          : SEED_PRODUCTS;

      const recommendations = runGiftMatchEngine(catalog, input);
      res.json({
        recommendations,
        count: recommendations.length,
        engine: 'rule-based-v1',
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Invalid GiftMatch request.',
      });
    }
  });

  // Authoritative Order Validation, Recalculation & Idempotency Guard
  app.post('/api/orders/validate', (req, res) => {
    try {
      const {
        idempotencyKey,
        customerDetails,
        deliveryAddress,
        paymentMethod,
        items,
        catalogProducts,
      } = req.body as {
        idempotencyKey: string;
        customerDetails: CustomerDetails;
        deliveryAddress: DeliveryAddress;
        paymentMethod: PaymentMethod;
        items: CartItem[];
        catalogProducts?: Partial<Product>[];
      };

      if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
        res.status(400).json({ error: 'Missing or invalid order submission key.' });
        return;
      }

      const formErrors = validateCheckoutForm(customerDetails, deliveryAddress);
      if (Object.keys(formErrors).length > 0) {
        const firstErr = Object.values(formErrors)[0];
        res.status(400).json({ error: firstErr, fieldErrors: formErrors });
        return;
      }

      if (
        paymentMethod !== 'Cash on Delivery' &&
        paymentMethod !== 'Online Payment (Demo Mode)'
      ) {
        res.status(400).json({ error: 'Invalid payment method selected.' });
        return;
      }

      if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
        res.status(400).json({ error: 'Your cart is empty or exceeds the item limit.' });
        return;
      }

      const existingEntry = processedIdempotencyKeys.get(idempotencyKey);
      const orderId = existingEntry ? existingEntry.orderId : generateUniqueOrderId();

      const productMap = new Map<string, Partial<Product>>();
      for (const p of SEED_PRODUCTS) productMap.set(p.id, p);
      if (Array.isArray(catalogProducts)) {
        for (const p of catalogProducts) {
          if (p.id) productMap.set(p.id, p);
        }
      }

      let subtotal = 0;
      let discount = 0;
      const verifiedItems = [];

      for (const item of items) {
        const qty = Math.floor(Number(item.quantity));
        if (!item.productId || !Number.isFinite(qty) || qty < 1 || qty > 20) {
          res.status(400).json({ error: 'Invalid product quantity in cart.' });
          return;
        }
        const prod = productMap.get(item.productId);
        if (!prod || prod.isActive === false) {
          res.status(400).json({ error: 'One or more products are no longer available.' });
          return;
        }
        if (typeof prod.stockQuantity === 'number' && qty > prod.stockQuantity) {
          res.status(409).json({
            error: `Only ${prod.stockQuantity} unit(s) available for ${prod.name}.`,
          });
          return;
        }
        const unitPrice = Number(prod.price ?? 0);
        const originalPrice = Math.max(unitPrice, Number(prod.originalPrice ?? unitPrice));
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;
        discount += (originalPrice - unitPrice) * qty;

        verifiedItems.push({
          productId: item.productId,
          name: String(prod.name ?? 'Product'),
          imageUrl: String(prod.imageUrl ?? ''),
          unitPrice,
          originalPrice,
          quantity: qty,
          lineTotal,
        });
      }

      const deliveryCharge = calculateDeliveryCharge(subtotal);
      const total = subtotal + deliveryCharge;

      if (!existingEntry) {
        processedIdempotencyKeys.set(idempotencyKey, { orderId, timestamp: Date.now() });
      }

      res.json({
        orderId,
        items: verifiedItems,
        subtotal,
        discount,
        deliveryCharge,
        total,
        paymentMethod,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unable to validate order.',
      });
    }
  });

  // Vite middleware in development, static bundle in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GIFTLY server running on http://localhost:${PORT}`);
  });
}

startServer();
