// Tiny client-only cart + order lifecycle store backed by localStorage.
// Prototype-only — no backend, all reads in-memory with cross-tab sync.

import { useSyncExternalStore } from "react";
import { products, productById, formatPhp } from "./mock-data";
import type { EscrowState } from "./mock-data";

export type CartItem = { productId: string; qty: number };
export type ShippingDest = "Metro Manila" | "Laguna" | "Cebu" | "Davao" | "Bulacan";

export const shippingTable: Record<ShippingDest, { cost: number; days: string }> = {
  "Metro Manila": { cost: 1200, days: "1-2 days" },
  "Bulacan": { cost: 800, days: "Same day" },
  "Laguna": { cost: 1800, days: "2-3 days" },
  "Cebu": { cost: 3400, days: "3-4 days" },
  "Davao": { cost: 4200, days: "4-6 days" },
};

export type DemoOrder = {
  id: string;
  buyer: string;
  supplierId: string;
  items: { productId: string; qty: number; price: number }[];
  subtotal: number;
  shippingCost: number;
  shippingDest: ShippingDest;
  totalPhp: number;
  placed: string;
  escrowState: EscrowState;
  payment: string;
  address: {
    business: string;
    contact: string;
    phone: string;
    address: string;
    instructions: string;
  };
  review?: {
    rating: number;
    quality: number;
    packaging: number;
    delivery: number;
    communication: number;
    comment: string;
  };
};

const CART_KEY = "psg_cart_v1";
const ORDERS_KEY = "psg_demo_orders_v1";
const SAVED_KEY = "psg_saved_v1";

const isBrowser = typeof window !== "undefined";
const EMPTY_CART: CartItem[] = [];
const EMPTY_SAVED: string[] = [];
const EMPTY_ORDERS: DemoOrder[] = [];
const storageCache = new Map<string, { raw: string; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const cached = storageCache.get(key);
    if (cached?.raw === raw) return cached.value as T;
    const value = JSON.parse(raw) as T;
    storageCache.set(key, { raw, value });
    return value;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, val: T) {
  if (!isBrowser) return;
  const raw = JSON.stringify(val);
  storageCache.set(key, { raw, value: val });
  localStorage.setItem(key, raw);
  window.dispatchEvent(new CustomEvent("psg-store-change", { detail: { key } }));
}

const listeners = new Set<() => void>();
if (isBrowser) {
  window.addEventListener("psg-store-change", () => listeners.forEach((l) => l()));
  window.addEventListener("storage", () => listeners.forEach((l) => l()));
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ===== Cart =====
export const getCart = (): CartItem[] => read<CartItem[]>(CART_KEY, EMPTY_CART);
export function addToCart(productId: string, qty: number) {
  const cart = getCart();
  const ex = cart.find((c) => c.productId === productId);
  if (ex) ex.qty += qty;
  else cart.push({ productId, qty });
  write(CART_KEY, cart);
}
export function removeFromCart(productId: string) {
  write(CART_KEY, getCart().filter((c) => c.productId !== productId));
}
export function updateCartQty(productId: string, qty: number) {
  const cart = getCart().map((c) => (c.productId === productId ? { ...c, qty } : c));
  write(CART_KEY, cart);
}
export function clearCart() { write(CART_KEY, []); }

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, getCart, () => EMPTY_CART);
}

export function cartCount(): number {
  return getCart().reduce((n, i) => n + 1, 0);
}
export function useCartCount(): number {
  return useSyncExternalStore(subscribe, cartCount, () => 0);
}

// ===== Saved / wishlist =====
export const getSaved = (): string[] => read<string[]>(SAVED_KEY, EMPTY_SAVED);
export function toggleSaved(productId: string) {
  const s = getSaved();
  const i = s.indexOf(productId);
  if (i >= 0) s.splice(i, 1);
  else s.push(productId);
  write(SAVED_KEY, s);
}
export function useSaved(): string[] {
  return useSyncExternalStore(subscribe, getSaved, () => EMPTY_SAVED);
}

// ===== Orders (demo) =====
export const getDemoOrders = (): DemoOrder[] => read<DemoOrder[]>(ORDERS_KEY, EMPTY_ORDERS);
export function saveDemoOrder(o: DemoOrder) {
  const all = getDemoOrders();
  const i = all.findIndex((x) => x.id === o.id);
  if (i >= 0) all[i] = o;
  else all.unshift(o);
  write(ORDERS_KEY, all);
}
export function getDemoOrder(id: string): DemoOrder | undefined {
  return getDemoOrders().find((o) => o.id === id);
}
export function useDemoOrder(id: string): DemoOrder | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getDemoOrder(id),
    () => undefined
  );
}

export function tierPriceFor(productId: string, qty: number): number {
  const p = productById(productId);
  const tier = [...p.tierPricing].reverse().find((t) => qty >= t.qty) ?? p.tierPricing[0];
  return tier.price;
}

export function newOrderIdFromTime(): string {
  const n = Math.floor(Date.now() / 1000) % 1000000;
  return `ord_d${n}`;
}

export function escrowOrder(args: {
  items: CartItem[];
  shippingDest: ShippingDest;
  payment: string;
  address: DemoOrder["address"];
}): DemoOrder {
  const lineItems = args.items.map((it) => ({
    productId: it.productId,
    qty: it.qty,
    price: tierPriceFor(it.productId, it.qty),
  }));
  const subtotal = lineItems.reduce((n, it) => n + it.qty * it.price, 0);
  const ship = shippingTable[args.shippingDest];
  const supplierId = productById(lineItems[0].productId).supplierId;
  return {
    id: newOrderIdFromTime(),
    buyer: "Lola Nena's Carinderia Group",
    supplierId,
    items: lineItems,
    subtotal,
    shippingCost: ship.cost,
    shippingDest: args.shippingDest,
    totalPhp: subtotal + ship.cost,
    placed: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
    escrowState: "Funds Held in Escrow",
    payment: args.payment,
    address: args.address,
  };
}

export { formatPhp, products };
