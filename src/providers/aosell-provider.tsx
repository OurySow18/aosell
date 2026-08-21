import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import type {
  Address,
  AppUser,
  Cart,
  DeliveryMode,
  Listing,
  ListingStatus,
  Notification,
  Order,
  OrderStatus,
  SellerProfile,
  SellerType,
  UserProfile,
} from '@/types/domain';
import { AuthRepository } from '@/repositories/auth-repository';
import { CartRepository } from '@/repositories/cart-repository';
import { ListingRepository } from '@/repositories/listing-repository';
import { NotificationRepository } from '@/repositories/notification-repository';
import { OrderRepository } from '@/repositories/order-repository';
import { SellerRepository } from '@/repositories/seller-repository';
import { UserProfileSeed, UserRepository } from '@/repositories/user-repository';
import { demoListings, demoSellers } from '@/services/mock-data';
import { translate } from '@/lib/i18n';
import { getNextStatuses } from '@/lib/utils/order';
import { computeCartTotals, resolveAddToCart } from '@/lib/cart';
import { searchListings as filterListings, type ListingSearchFilters } from '@/lib/search';
import { DEFAULT_CITY, DEFAULT_COUNTRY_CODE } from '@/constants/location';

type SaveListingInput = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  amountCents: number;
  type: Listing['type'];
  deliveryMode: DeliveryMode;
  city: string;
  countryCode: string;
  status: ListingStatus;
  tags: string[];
  categories: string[];
  hasVideo: boolean;
};

type CreateSellerProfileInput = {
  type: SellerType;
  brandName: string;
  description: string;
  city: string;
  countryCode: string;
  deliveryModes: DeliveryMode[];
};

type AddToCartResult = {
  ok: boolean;
  requiresReplace: boolean;
  requiresAuth?: boolean;
};

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = SignInInput & {
  firstName: string;
  lastName: string;
  role: 'buyer' | 'seller';
};

type AosellContextValue = {
  authReady: boolean;
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  addresses: Address[];
  sellers: SellerProfile[];
  currentSellerProfile: SellerProfile | null;
  listings: Listing[];
  cart: Cart | null;
  orders: Order[];
  notifications: Notification[];
  signIn: (input: SignInInput) => Promise<AppUser | null>;
  signUp: (input: SignUpInput) => Promise<AppUser | null>;
  logout: () => Promise<void>;
  createSellerProfile: (input: CreateSellerProfileInput) => Promise<SellerProfile | null>;
  saveListing: (input: SaveListingInput) => Promise<Listing | null>;
  getListingById: (id: string) => Listing | undefined;
  getSellerById: (id: string) => SellerProfile | undefined;
  searchListings: (filters: ListingSearchFilters) => Listing[];
  addToCart: (listingId: string, forceReplace?: boolean) => Promise<AddToCartResult>;
  updateCartQuantity: (listingId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Address | null>;
  placeOrder: (addressId: string) => Promise<Order | null>;
  advanceOrderStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  markNotificationRead: (notificationId: string) => Promise<void>;
};

const AosellContext = createContext<AosellContextValue | undefined>(undefined);

function mergeById<T extends { id: string }>(...groups: T[][]) {
  const registry = new Map<string, T>();

  for (const group of groups) {
    for (const item of group) {
      registry.set(item.id, item);
    }
  }

  return Array.from(registry.values()).sort((left, right) =>
    'createdAt' in left && 'createdAt' in right
      ? String(right.createdAt).localeCompare(String(left.createdAt))
      : 0
  );
}

export function AosellProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>(demoSellers);
  const [currentSellerProfile, setCurrentSellerProfile] = useState<SellerProfile | null>(null);
  const [publicListings, setPublicListings] = useState<Listing[]>(
    demoListings.filter((listing) => listing.status === 'active')
  );
  const [ownedListings, setOwnedListings] = useState<Listing[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const listings = mergeById(publicListings, ownedListings);
  const orders = mergeById(buyerOrders, sellerOrders);

  useEffect(() => {
    const unsubscribeAuth = AuthRepository.subscribe(
      (user) => {
        setCurrentUser(user);

        if (!user) {
          setUserProfile(null);
          setAddresses([]);
          setCurrentSellerProfile(null);
          setOwnedListings([]);
          setCart(null);
          setBuyerOrders([]);
          setSellerOrders([]);
          setNotifications([]);
        }
      },
      () => {
        setAuthReady(true);
      }
    );

    const unsubscribeSellers = SellerRepository.subscribePublic(setSellers);
    const unsubscribeListings = ListingRepository.subscribePublicActive(setPublicListings);

    return () => {
      unsubscribeAuth();
      unsubscribeSellers();
      unsubscribeListings();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let isActive = true;

    UserRepository.ensureProfile(currentUser)
      .then((profile) => {
        if (isActive) {
          setUserProfile((current) => current ?? profile);
        }
      })
      .catch(() => undefined);

    const unsubscribeProfile = UserRepository.subscribeProfile(currentUser.id, setUserProfile);
    const unsubscribeAddresses = UserRepository.subscribeAddresses(currentUser.id, setAddresses);
    const unsubscribeCart = CartRepository.subscribeCurrent(currentUser.id, setCart);
    const unsubscribeBuyerOrders = OrderRepository.subscribeForBuyer(currentUser.id, setBuyerOrders);
    const unsubscribeNotifications = NotificationRepository.subscribeForUser(
      currentUser.id,
      setNotifications
    );
    const unsubscribeOwnedSeller = SellerRepository.subscribeOwned(
      currentUser.id,
      setCurrentSellerProfile
    );

    return () => {
      isActive = false;
      unsubscribeProfile();
      unsubscribeAddresses();
      unsubscribeCart();
      unsubscribeBuyerOrders();
      unsubscribeNotifications();
      unsubscribeOwnedSeller();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentSellerProfile) {
      setOwnedListings([]);
      setSellerOrders([]);
      return;
    }

    const unsubscribeListings = ListingRepository.subscribeBySeller(
      currentSellerProfile.id,
      setOwnedListings
    );
    const unsubscribeOrders = OrderRepository.subscribeForSeller(
      currentSellerProfile.id,
      setSellerOrders
    );

    return () => {
      unsubscribeListings();
      unsubscribeOrders();
    };
  }, [currentSellerProfile?.id]);

  useEffect(() => {
    setUserProfile((current) => (current ? { ...current, addresses } : current));
  }, [addresses, userProfile?.userId]);

  async function signIn(input: SignInInput) {
    const user = await AuthRepository.signIn(input);
    await UserRepository.ensureProfile(user);
    setCurrentUser(user);
    return user;
  }

  async function signUp(input: SignUpInput) {
    const user = await AuthRepository.signUp({
      email: input.email,
      password: input.password,
      role: input.role,
    });
    const profileSeed: UserProfileSeed = {
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
      city: DEFAULT_CITY,
      countryCode: DEFAULT_COUNTRY_CODE,
    };

    await UserRepository.ensureProfile(user, profileSeed);
    setCurrentUser(user);
    return user;
  }

  async function logout() {
    await AuthRepository.signOut();
    setCurrentUser(null);
    setCurrentSellerProfile(null);
    setCart(null);
  }

  async function createSellerProfile(input: CreateSellerProfileInput) {
    if (!currentUser) {
      return null;
    }

    const profile = await SellerRepository.create(currentUser, input);
    setCurrentSellerProfile(profile);
    setSellers((current) => mergeById(current, [profile]));
    return profile;
  }

  async function saveListing(input: SaveListingInput) {
    if (!currentSellerProfile) {
      return null;
    }

    const existing = input.id ? getListingById(input.id) : undefined;
    const listing = await ListingRepository.save(currentSellerProfile, input, existing);

    setOwnedListings((current) => mergeById(current, [listing]));
    if (listing.status === 'active') {
      setPublicListings((current) => mergeById(current, [listing]));
    } else {
      setPublicListings((current) => current.filter((item) => item.id !== listing.id));
    }

    return listing;
  }

  function getListingById(id: string) {
    return listings.find((listing) => listing.id === id);
  }

  function getSellerById(id: string) {
    return sellers.find((seller) => seller.id === id);
  }

  function searchListings(filters: ListingSearchFilters) {
    return filterListings(listings, sellers, filters);
  }

  async function addToCart(listingId: string, forceReplace = false): Promise<AddToCartResult> {
    if (!currentUser) {
      return { ok: false, requiresReplace: false, requiresAuth: true };
    }

    const listing = getListingById(listingId);
    const decision = resolveAddToCart({ cart, listing, forceReplace });

    if (decision.kind === 'not-found') {
      return { ok: false, requiresReplace: false };
    }
    if (decision.kind === 'requires-replace') {
      return { ok: false, requiresReplace: true };
    }

    const nextCart = computeCartTotals(decision.items, decision.sellerId, {
      buyerUserId: currentUser.id,
      createdAt: cart?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await CartRepository.save(nextCart);
    setCart(nextCart);
    return { ok: true, requiresReplace: false };
  }

  async function updateCartQuantity(listingId: string, quantity: number) {
    if (!currentUser || !cart) {
      return;
    }

    const nextItems = cart.items
      .map((item) => (item.listingId === listingId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    if (!nextItems.length) {
      await CartRepository.clear(currentUser.id);
      setCart(null);
      return;
    }

    const nextCart = computeCartTotals(nextItems, cart.sellerId, {
      buyerUserId: currentUser.id,
      createdAt: cart.createdAt,
      updatedAt: new Date().toISOString(),
    });
    await CartRepository.save(nextCart);
    setCart(nextCart);
  }

  async function clearCart() {
    if (!currentUser) {
      return;
    }

    await CartRepository.clear(currentUser.id);
    setCart(null);
  }

  async function addAddress(address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!currentUser) {
      return null;
    }

    const nextAddress = await UserRepository.addAddress(currentUser.id, address);
    setAddresses((current) => mergeById(current, [nextAddress]));
    setUserProfile((current) =>
      current
        ? {
            ...current,
            addresses: mergeById(current.addresses, [nextAddress]),
            updatedAt: new Date().toISOString(),
          }
        : current
    );
    return nextAddress;
  }

  async function placeOrder(addressId: string) {
    if (!cart || !currentUser) {
      return null;
    }

    const address = addresses.find((item) => item.id === addressId);
    if (!address) {
      return null;
    }

    const createdAt = new Date().toISOString();
    const order: Order = {
      id: '',
      buyerUserId: currentUser.id,
      sellerId: cart.sellerId,
      status: 'pending_payment',
      items: cart.items.map((item, index) => ({
        id: `${item.listingId}-${index}`,
        listingId: item.listingId,
        titleSnapshot: item.titleSnapshot,
        unitPriceSnapshot: item.unitPriceSnapshot,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      total: cart.total,
      currency: 'EUR',
      deliveryMode: getListingById(cart.items[0]?.listingId ?? '')?.deliveryMode ?? 'aosell',
      deliveryAddress: address,
      timeline: [
        { status: 'created', at: createdAt },
        { status: 'pending_payment', at: createdAt },
      ],
      createdAt,
      updatedAt: createdAt,
    };

    const createdOrder = await OrderRepository.create(order);
    setBuyerOrders((current) => mergeById(current, [createdOrder]));

    await NotificationRepository.create(currentUser.id, {
      type: 'order_created',
      title: translate('notifications.orderCreatedTitle'),
      body: translate('notifications.orderCreatedBody', { orderId: createdOrder.id }),
      isRead: false,
      data: { orderId: createdOrder.id },
    });

    await clearCart();
    return createdOrder;
  }

  async function advanceOrderStatus(orderId: string, nextStatus: OrderStatus) {
    const existing = orders.find((order) => order.id === orderId);
    if (!existing || !getNextStatuses(existing.status).includes(nextStatus)) {
      return;
    }

    const nextOrder = await OrderRepository.advanceStatus(existing, nextStatus);
    setBuyerOrders((current) => mergeById(current, [nextOrder]));
    setSellerOrders((current) => mergeById(current, [nextOrder]));
  }

  function getOrderById(orderId: string) {
    return orders.find((order) => order.id === orderId);
  }

  async function markNotificationRead(notificationId: string) {
    if (!currentUser) {
      return;
    }

    await NotificationRepository.markRead(currentUser.id, notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
  }

  return (
    <AosellContext.Provider
      value={{
        authReady,
        currentUser,
        userProfile,
        addresses,
        sellers,
        currentSellerProfile,
        listings,
        cart,
        orders,
        notifications,
        signIn,
        signUp,
        logout,
        createSellerProfile,
        saveListing,
        getListingById,
        getSellerById,
        searchListings,
        addToCart,
        updateCartQuantity,
        clearCart,
        addAddress,
        placeOrder,
        advanceOrderStatus,
        getOrderById,
        markNotificationRead,
      }}>
      {children}
    </AosellContext.Provider>
  );
}

export function useAosell() {
  const context = useContext(AosellContext);
  if (!context) {
    throw new Error('useAosell must be used within AosellProvider');
  }
  return context;
}
