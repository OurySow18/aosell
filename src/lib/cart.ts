import type { Cart, CartItem, Listing } from '@/types/domain';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';

export const CART_DELIVERY_FEE_CENTS = 450;

export function computeCartTotals(
  items: CartItem[],
  sellerId: string,
  context: { buyerUserId: string; createdAt: string; updatedAt: string },
): Cart {
  const subtotalAmount = items.reduce(
    (total, item) => total + item.unitPriceSnapshot.amountCents * item.quantity,
    0,
  );
  const deliveryFeeAmount = items.length ? CART_DELIVERY_FEE_CENTS : 0;

  return {
    id: context.buyerUserId,
    buyerUserId: context.buyerUserId,
    sellerId,
    items,
    subtotal: { amountCents: subtotalAmount, currency: 'EUR' },
    deliveryFee: { amountCents: deliveryFeeAmount, currency: 'EUR' },
    total: { amountCents: subtotalAmount + deliveryFeeAmount, currency: 'EUR' },
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
