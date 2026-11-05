import type { Cart, CartItem, Listing } from '@/types/domain';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';

export const CART_DELIVERY_FEE_CENTS = 450;

export type PromoCode = {
  code: string;
  labelKey: string;
  rate: number;
};

const PROMO_CODES: Record<string, PromoCode> = {
  BREMEN10: { code: 'BREMEN10', labelKey: 'cart.promo.bremen10', rate: 0.1 },
};

export function resolvePromoCode(input: string): PromoCode | null {
  const normalized = input.trim().toUpperCase();
  return PROMO_CODES[normalized] ?? null;
}

export function computeCartTotals(
  items: CartItem[],
  sellerId: string,
  context: { buyerUserId: string; createdAt: string; updatedAt: string; promoCode?: string },
): Cart {
  const subtotalAmount = items.reduce(
    (total, item) => total + item.unitPriceSnapshot.amountCents * item.quantity,
    0,
  );
  const deliveryFeeAmount = items.length ? CART_DELIVERY_FEE_CENTS : 0;
  const promo = context.promoCode ? resolvePromoCode(context.promoCode) : null;
  const discountAmount = promo ? Math.round(subtotalAmount * promo.rate) : 0;

  return {
    id: context.buyerUserId,
    buyerUserId: context.buyerUserId,
    sellerId,
    items,
    subtotal: { amountCents: subtotalAmount, currency: 'EUR' },
    deliveryFee: { amountCents: deliveryFeeAmount, currency: 'EUR' },
    discount: { amountCents: discountAmount, currency: 'EUR' },
    promoCode: promo?.code,
    total: { amountCents: subtotalAmount + deliveryFeeAmount - discountAmount, currency: 'EUR' },
    createdAt: context.createdAt,
    updatedAt: context.updatedAt,
  };
}

export function addOrIncrementItem(items: CartItem[], listing: Listing): CartItem[] {
  const existingIndex = items.findIndex((item) => item.listingId === listing.id);

  if (existingIndex === -1) {
    return [
      ...items,
      {
        listingId: listing.id,
        titleSnapshot: listing.title,
        unitPriceSnapshot: listing.price,
        quantity: 1,
        imageUrl: getPrimaryListingImage(listing)?.url,
      },
    ];
  }

  return items.map((item, index) =>
    index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
  );
}

export type AddToCartDecision =
  | { kind: 'not-found' }
  | { kind: 'requires-replace' }
  | { kind: 'add'; items: CartItem[]; sellerId: string };

export function resolveAddToCart(params: {
  cart: Cart | null;
  listing: Listing | undefined;
  forceReplace: boolean;
}): AddToCartDecision {
  const { cart, listing, forceReplace } = params;

  if (!listing) {
    return { kind: 'not-found' };
  }

  const sameSeller = cart?.sellerId === listing.sellerId;

  if (cart && !sameSeller && !forceReplace) {
    return { kind: 'requires-replace' };
  }

  // forceReplace swaps to a fresh single-seller cart rather than merging in
  // the previous seller's items, matching the "one store per order" rule.
  const baseItems = cart && sameSeller ? cart.items : [];

  return {
    kind: 'add',
    items: addOrIncrementItem(baseItems, listing),
    sellerId: listing.sellerId,
  };
}
