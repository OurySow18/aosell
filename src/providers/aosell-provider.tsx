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
import { UserRepository } from '@/repositories/user-repository';
import { demoListings, demoSellers } from '@/services/mock-data';
import { getNextStatuses } from '@/lib/utils/order';

type SearchFilters = {
  query?: string;
  type?: Listing['type'] | 'all';
  sellerType?: SellerType | 'all';
  deliveryMode?: DeliveryMode | 'all';
  countryCode?: string;
  city?: string;
};

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

type AosellContextValue = {
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  addresses: Address[];
  sellers: SellerProfile[];
  currentSellerProfile: SellerProfile | null;
  listings: Listing[];
  cart: Cart | null;
  orders: Order[];
  notifications: Notification[];
  signInAs: (role: 'buyer' | 'seller') => Promise<AppUser | null>;
  logout: () => Promise<void>;
  createSellerProfile: (input: CreateSellerProfileInput) => Promise<SellerProfile | null>;
  saveListing: (input: SaveListingInput) => Promise<Listing | null>;
  getListingById: (id: string) => Listing | undefined;
  getSellerById: (id: string) => SellerProfile | undefined;
  searchListings: (filters: SearchFilters) => Listing[];
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
    const unsubscribeAuth = AuthRepository.subscribe((user) => {
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
    });

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

    UserRepository.ensureProfile(currentUser).catch(() => undefined);

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

  async function signInAs(role: 'buyer' | 'seller') {
    const user = await AuthRepository.signIn(role);
    await UserRepository.ensureProfile(user);
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

  function searchListings(filters: SearchFilters) {
    return listings.filter((listing) => {
      const seller = getSellerById(listing.sellerId);
      const query = filters.query?.trim().toLowerCase();
      const haystack = [
        listing.title,
        listing.description,
        listing.tags.join(' '),
        listing.categories.join(' '),
        listing.city,
        seller?.brandName ?? '',
      ]
        .join(' ')
        .toLowerCase();

      if (listing.status !== 'active') {
        return false;
      }
      if (query && !haystack.includes(query)) {
        return false;
      }
      if (filters.type && filters.type !== 'all' && listing.type !== filters.type) {
        return false;
      }
      if (filters.sellerType && filters.sellerType !== 'all' && seller?.type !== filters.sellerType) {
        return false;
      }
      if (
        filters.deliveryMode &&
        filters.deliveryMode !== 'all' &&
        listing.deliveryMode !== filters.deliveryMode
      ) {
        return false;
      }
      if (filters.countryCode && listing.countryCode !== filters.countryCode.toUpperCase()) {
        return false;
      }
      if (filters.city && listing.city.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  function computeCart(currentItems: Cart['items'], sellerId: string): Cart {
    const subtotalAmount = currentItems.reduce(
      (total, item) => total + item.unitPriceSnapshot.amountCents * item.quantity,
      0
    );
    const deliveryFeeAmount = currentItems.length ? 450 : 0;

    return {
      id: currentUser?.id ?? 'anonymous-cart',
      buyerUserId: currentUser?.id ?? 'anonymous-user',
      sellerId,
      items: currentItems,
      subtotal: { amountCents: subtotalAmount, currency: 'EUR' },
      deliveryFee: { amountCents: deliveryFeeAmount, currency: 'EUR' },
      total: { amountCents: subtotalAmount + deliveryFeeAmount, currency: 'EUR' },
      createdAt: cart?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function addToCart(listingId: string, forceReplace = false): Promise<AddToCartResult> {
    if (!currentUser) {
      return { ok: false, requiresReplace: false, requiresAuth: true };
    }

    const listing = getListingById(listingId);
    if (!listing) {
      return { ok: false, requiresReplace: false };
    }

    if (cart && cart.sellerId !== listing.sellerId && !forceReplace) {
      return { ok: false, requiresReplace: true };
    }

    const currentItems =
      cart && (cart.sellerId === listing.sellerId || forceReplace) ? [...cart.items] : [];
    const existingItem = currentItems.find((item) => item.listingId === listing.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentItems.push({
        listingId: listing.id,
        titleSnapshot: listing.title,
        unitPriceSnapshot: listing.price,
        quantity: 1,
      });
    }

    const nextCart = computeCart(currentItems, listing.sellerId);
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

    const nextCart = computeCart(nextItems, cart.sellerId);
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
      title: 'Order created',
      body: `Your order ${createdOrder.id} has been created and is awaiting payment confirmation.`,
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
        currentUser,
        userProfile,
        addresses,
        sellers,
        currentSellerProfile,
        listings,
        cart,
        orders,
        notifications,
        signInAs,
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
