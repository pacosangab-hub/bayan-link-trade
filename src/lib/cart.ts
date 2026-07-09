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

export type StageKey =
  | "created"
  | "funded"
  | "confirmed"
  | "preparing"
  | "ready"
  | "transit"
  | "delivered"
  | "buyer_confirmed"
  | "released";

export type ProofType =
  | "Packed goods photo"
  | "Packing list"
  | "Delivery receipt"
  | "Driver details"
  | "Proof of delivery"
  | "Invoice"
  | "Other";

export type Proof = {
  id: string;
  stage: StageKey;
  type: ProofType;
  fileName: string;
  imageUrl?: string;
  notes?: string;
  uploadedBy: string;
  at: string;
};

export type StageRecord = { at: string; note?: string };

export type DisputeRecord = {
  issueType: string;
  description: string;
  at: string;
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
  stages?: Partial<Record<StageKey, StageRecord>>;
  proofs?: Proof[];
  dispute?: DisputeRecord;
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
  const now = new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
  return {
    id: newOrderIdFromTime(),
    buyer: "Lola Nena's Carinderia Group",
    supplierId,
    items: lineItems,
    subtotal,
    shippingCost: ship.cost,
    shippingDest: args.shippingDest,
    totalPhp: subtotal + ship.cost,
    placed: now,
    escrowState: "Funds Held in Escrow",
    payment: args.payment,
    address: args.address,
    stages: {
      created: { at: now, note: "Custom offer accepted · Order summary generated" },
      funded: { at: now, note: "Demo escrow payment confirmed" },
    },
    proofs: [],
  };
}

// ===== Stage / proof / dispute helpers =====
export const STAGE_ORDER: StageKey[] = [
  "created", "funded", "confirmed", "preparing", "ready",
  "transit", "delivered", "buyer_confirmed", "released",
];

function nowLabel() {
  return new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

/** Copy a mock order into localStorage so it becomes interactive. */
export function ensureDemoOrder(id: string): DemoOrder | undefined {
  const existing = getDemoOrder(id);
  if (existing) return existing;
  const mock = products.length ? undefined : undefined; // avoid unused import warning
  void mock;
  // dynamic import-safe access — mock orders live in mock-data
  const { orders: MOCK_ORDERS, productById: pById } = require("./mock-data") as typeof import("./mock-data");
  const o = MOCK_ORDERS.find((x) => x.id === id);
  if (!o) return undefined;
  const p = pById(o.items[0].productId);
  const hydrated: DemoOrder = {
    id: o.id,
    buyer: o.buyer,
    supplierId: o.supplierId,
    items: o.items,
    subtotal: o.totalPhp,
    shippingCost: 0,
    shippingDest: "Metro Manila",
    totalPhp: o.totalPhp,
    placed: o.placed,
    escrowState: o.escrowState,
    payment: "Bank Transfer",
    address: {
      business: o.buyer,
      contact: o.buyer,
      phone: "+63 917 000 0000",
      address: `Delivery to ${o.buyer}`,
      instructions: "",
    },
    stages: seedStagesForState(o.escrowState, o.placed),
    proofs: seedProofsForState(o.escrowState, o.placed, p.title),
  };
  saveDemoOrder(hydrated);
  return hydrated;
}

function seedStagesForState(state: EscrowState, at: string): DemoOrder["stages"] {
  const s: NonNullable<DemoOrder["stages"]> = {
    created: { at, note: "Order created" },
  };
  const has = (k: EscrowState) =>
    ["Funds Held in Escrow","Preparing Shipment","In Transit","Delivered — Awaiting Confirmation","Released to Supplier"].indexOf(state) >=
    ["Funds Held in Escrow","Preparing Shipment","In Transit","Delivered — Awaiting Confirmation","Released to Supplier"].indexOf(k);
  if (has("Funds Held in Escrow")) s.funded = { at, note: "Escrow funded" };
  if (has("Preparing Shipment")) { s.confirmed = { at, note: "Supplier accepted" }; s.preparing = { at, note: "Packing goods" }; }
  if (has("In Transit")) { s.ready = { at, note: "Ready for pickup" }; s.transit = { at, note: "On the road" }; }
  if (has("Delivered — Awaiting Confirmation")) s.delivered = { at, note: "Delivered to buyer" };
  if (has("Released to Supplier")) { s.buyer_confirmed = { at, note: "Buyer confirmed receipt" }; s.released = { at, note: "Escrow released" }; }
  return s;
}

function seedProofsForState(state: EscrowState, at: string, productTitle: string): Proof[] {
  const proofs: Proof[] = [];
  const idx = ["Awaiting Supplier Acceptance","Funds Held in Escrow","Preparing Shipment","In Transit","Delivered — Awaiting Confirmation","Released to Supplier"].indexOf(state);
  if (idx >= 2) proofs.push({
    id: `pf_${Math.random().toString(36).slice(2,8)}`,
    stage: "preparing", type: "Packed goods photo",
    fileName: `packed-${productTitle.toLowerCase().replace(/\s+/g,"-").slice(0,24)}.jpg`,
    uploadedBy: "Supplier", at,
  });
  if (idx >= 3) proofs.push({
    id: `pf_${Math.random().toString(36).slice(2,8)}`,
    stage: "transit", type: "Driver details",
    fileName: "driver-juan-dela-cruz.pdf",
    notes: "Juan Dela Cruz · Plate NCR 4821",
    uploadedBy: "Supplier", at,
  });
  if (idx >= 4) proofs.push({
    id: `pf_${Math.random().toString(36).slice(2,8)}`,
    stage: "delivered", type: "Proof of delivery",
    fileName: "signed-receiving-copy.jpg",
    uploadedBy: "Supplier", at,
  });
  return proofs;
}

export function currentStage(o: DemoOrder): StageKey {
  const s = o.stages ?? {};
  for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
    if (s[STAGE_ORDER[i]]) return STAGE_ORDER[i];
  }
  return "created";
}

export function nextStage(o: DemoOrder): StageKey | null {
  const cur = currentStage(o);
  const i = STAGE_ORDER.indexOf(cur);
  return i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}

const ESCROW_FOR_STAGE: Record<StageKey, EscrowState> = {
  created: "Awaiting Supplier Acceptance",
  funded: "Funds Held in Escrow",
  confirmed: "Funds Held in Escrow",
  preparing: "Preparing Shipment",
  ready: "Preparing Shipment",
  transit: "In Transit",
  delivered: "Delivered — Awaiting Confirmation",
  buyer_confirmed: "Released to Supplier",
  released: "Released to Supplier",
};

export function advanceStage(id: string, to: StageKey, note?: string) {
  const o = getDemoOrder(id);
  if (!o) return;
  const stages = { ...(o.stages ?? {}) };
  stages[to] = { at: nowLabel(), note };
  saveDemoOrder({ ...o, stages, escrowState: ESCROW_FOR_STAGE[to] });
}

export function addProof(id: string, proof: Omit<Proof, "id" | "at">) {
  const o = getDemoOrder(id);
  if (!o) return;
  const proofs = [...(o.proofs ?? []), {
    ...proof,
    id: `pf_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    at: nowLabel(),
  }];
  saveDemoOrder({ ...o, proofs });
}

export function confirmDeliveryAndRelease(id: string) {
  const o = getDemoOrder(id);
  if (!o) return;
  const stages = { ...(o.stages ?? {}) };
  stages.buyer_confirmed = { at: nowLabel(), note: "Buyer confirmed delivery" };
  stages.released = { at: nowLabel(), note: "Escrow released to supplier" };
  saveDemoOrder({ ...o, stages, escrowState: "Released to Supplier" });
}

export function disputeOrder(id: string, dispute: DisputeRecord) {
  const o = getDemoOrder(id);
  if (!o) return;
  saveDemoOrder({ ...o, escrowState: "Disputed", dispute });
}

export { formatPhp, products };
