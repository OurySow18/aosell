import type { Cart, CartItem, Listing } from '@/types/domain';
import { addOrIncrementItem, computeCartTotals, resolveAddToCart } from '@/lib/cart';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    sellerId: 'seller-1',
    type: 'product',
    title: 'Sourdough loaf',
    slug: 'sourdough-loaf',
    description: 'Fresh sourdough bread.',
    price: { amountCents: 500, currency: 'EUR' },
    status: 'active',
    deliveryMode: 'seller',
    countryCode: 'DE',
    city: 'Bremen',
    tags: [],
    categories: [],
    media: [],
    attributes: [],
    inventory: { isUnlimited: true },
    isFeatured: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    listingId: 'listing-1',
    titleSnapshot: 'Sourdough loaf',
    unitPriceSnapshot: { amountCents: 500, currency: 'EUR' },
    quantity: 1,
    ...overrides,
  };
}

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 'buyer-1',
    buyerUserId: 'buyer-1',
    sellerId: 'seller-1',
    items: [makeCartItem()],
    subtotal: { amountCents: 500, currency: 'EUR' },
    deliveryFee: { amountCents: 450, currency: 'EUR' },
    total: { amountCents: 950, currency: 'EUR' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeCartTotals', () => {
  it('sums line totals and adds the delivery fee when the cart has items', () => {
    const items = [
      makeCartItem({ listingId: 'a', quantity: 2, unitPriceSnapshot: { amountCents: 500, currency: 'EUR' } }),
      makeCartItem({ listingId: 'b', quantity: 1, unitPriceSnapshot: { amountCents: 300, currency: 'EUR' } }),
    ];

    const cart = computeCartTotals(items, 'seller-1', {
      buyerUserId: 'buyer-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    expect(cart.subtotal.amountCents).toBe(1300);
    expect(cart.deliveryFee.amountCents).toBe(450);
    expect(cart.total.amountCents).toBe(1750);
    expect(cart.sellerId).toBe('seller-1');
    expect(cart.buyerUserId).toBe('buyer-1');
  });

  it('charges no delivery fee for an empty cart', () => {
    const cart = computeCartTotals([], 'seller-1', {
      buyerUserId: 'buyer-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(cart.subtotal.amountCents).toBe(0);
    expect(cart.deliveryFee.amountCents).toBe(0);
    expect(cart.total.amountCents).toBe(0);
  });
});

describe('addOrIncrementItem', () => {
  it('adds a new listing as a fresh line item with quantity 1', () => {
    const listing = makeListing();
    const items = addOrIncrementItem([], listing);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ listingId: listing.id, quantity: 1 });
  });

  it('increments the quantity of an already-present listing without duplicating it', () => {
    const listing = makeListing();
    const items = addOrIncrementItem([makeCartItem({ listingId: listing.id, quantity: 2 })], listing);

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('does not mutate the input array', () => {
    const listing = makeListing();
    const original = [makeCartItem({ listingId: listing.id, quantity: 1 })];
    const originalItemRef = original[0];

    addOrIncrementItem(original, listing);

    expect(original[0]).toBe(originalItemRef);
    expect(original[0].quantity).toBe(1);
  });
});

describe('resolveAddToCart', () => {
  it('reports not-found when the listing does not exist', () => {
    const decision = resolveAddToCart({ cart: null, listing: undefined, forceReplace: false });
    expect(decision).toEqual({ kind: 'not-found' });
  });

  it('starts a fresh cart when there is no existing cart', () => {
    const listing = makeListing();
    const decision = resolveAddToCart({ cart: null, listing, forceReplace: false });

    expect(decision.kind).toBe('add');
    if (decision.kind === 'add') {
      expect(decision.sellerId).toBe(listing.sellerId);
      expect(decision.items).toEqual([
        expect.objectContaining({ listingId: listing.id, quantity: 1 }),
      ]);
    }
  });

  it('requires a replace confirmation when adding from a different seller', () => {
    const listing = makeListing({ sellerId: 'seller-2' });
    const cart = makeCart({ sellerId: 'seller-1' });

    const decision = resolveAddToCart({ cart, listing, forceReplace: false });

    expect(decision).toEqual({ kind: 'requires-replace' });
  });

  it('replaces the cart with only the new listing when forceReplace is set', () => {
    const listing = makeListing({ id: 'listing-2', sellerId: 'seller-2' });
    const cart = makeCart({ sellerId: 'seller-1', items: [makeCartItem({ listingId: 'listing-1' })] });

    const decision = resolveAddToCart({ cart, listing, forceReplace: true });

    expect(decision.kind).toBe('add');
    if (decision.kind === 'add') {
      expect(decision.sellerId).toBe('seller-2');
      expect(decision.items).toHaveLength(1);
      expect(decision.items[0].listingId).toBe('listing-2');
    }
  });

  it('merges into the existing cart when adding from the same seller', () => {
    const listing = makeListing({ id: 'listing-2', sellerId: 'seller-1' });
    const cart = makeCart({ sellerId: 'seller-1', items: [makeCartItem({ listingId: 'listing-1' })] });

    const decision = resolveAddToCart({ cart, listing, forceReplace: false });

    expect(decision.kind).toBe('add');
    if (decision.kind === 'add') {
      expect(decision.items).toHaveLength(2);
    }
  });
});
