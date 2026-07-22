// LocalStorage-backed inventory & stock management for demo mode.
// Keyed by product id (works for both mock products and supplier listings).
import { useSyncExternalStore } from "react";
import { products as MOCK_PRODUCTS } from "@/lib/mock-data";

export type StockTrackingType = "exact" | "made_to_order" | "quote_only" | "unlimited";

export type StockStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock"
  | "Made to Order"
  | "Quote for Availability"
  | "Paused";

export type MovementType =
  | "manual_adjust"
  | "add_stock"
  | "reduce_stock"
  | "order_reserved"
  | "order_cancelled"
  | "order_completed"
  | "marked_out"
  | "marked_in"
  | "status_change";

export type Movement = {
  id: string;
  productId: string;
  type: MovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  relatedOrderId?: string;
  createdAt: number;
  createdBy?: string;
};

export type InventoryRecord = {
  productId: string;
  supplierId?: string;
  trackingType: StockTrackingType;
  available: number;
  reserved: number;
  incoming: number;
  unit: string;
  lowStockThreshold: number;
  restockDate?: string;
  leadTime?: string;
  paused: boolean;
  lastUpdated: number;
};

const INV_KEY = "psg.inventory.v1";
const MOV_KEY = "psg.inventory.movements.v1";

const listeners = new Set<() => void>();
let invCache: Record<string, InventoryRecord> | null = null;
let movCache: Movement[] | null = null;
const EMPTY_INV: Record<string, InventoryRecord> = {};
const EMPTY_MOV: Movement[] = [];

function loadInv(): Record<string, InventoryRecord> {
  if (typeof window === "undefined") return EMPTY_INV;
  try {
    const raw = localStorage.getItem(INV_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function loadMov(): Movement[] {
  if (typeof window === "undefined") return EMPTY_MOV;
  try {
    const raw = localStorage.getItem(MOV_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
function readInv(): Record<string, InventoryRecord> {
  if (typeof window === "undefined") return EMPTY_INV;
  if (invCache === null) invCache = loadInv();
  return invCache;
}
function readMov(): Movement[] {
  if (typeof window === "undefined") return EMPTY_MOV;
  if (movCache === null) movCache = loadMov();
  return movCache;
}
function writeInv(next: Record<string, InventoryRecord>) {
  invCache = next;
  try { localStorage.setItem(INV_KEY, JSON.stringify(next)); } catch {}
  emit();
}
function writeMov(next: Movement[]) {
  movCache = next;
  try { localStorage.setItem(MOV_KEY, JSON.stringify(next)); } catch {}
  emit();
}
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

// -------- Defaults --------

function seedFromMock(productId: string): InventoryRecord | null {
  const p = MOCK_PRODUCTS.find((x) => x.id === productId);
  if (!p) return null;
  const stockStr = (p.stock || "").toLowerCase();
  let tracking: StockTrackingType = "exact";
  if (stockStr.includes("order")) tracking = "made_to_order";
  if (stockStr.includes("project")) tracking = "quote_only";
  // parse a number out of e.g. "In stock — 4,200 sacks"
  const num = parseInt((p.stock.match(/([\d,]+)/)?.[1] ?? "").replace(/,/g, ""), 10);
  const available = tracking === "exact" ? (isFinite(num) ? num : p.moq * 20) : 0;
  return {
    productId,
    supplierId: p.supplierId,
    trackingType: tracking,
    available,
    reserved: 0,
    incoming: 0,
    unit: p.unit,
    lowStockThreshold: Math.max(p.moq * 2, Math.round(available * 0.1) || p.moq),
    leadTime: `${p.leadTimeDays}-${p.leadTimeDays + 2} days`,
    paused: false,
    lastUpdated: Date.now(),
  };
}

export function defaultRecordFor(productId: string, hint?: Partial<InventoryRecord>): InventoryRecord {
  const seeded = seedFromMock(productId);
  const base: InventoryRecord =
    seeded ?? {
      productId,
      supplierId: hint?.supplierId,
      trackingType: hint?.trackingType ?? "exact",
      available: hint?.available ?? 100,
      reserved: 0,
      incoming: 0,
      unit: hint?.unit ?? "unit",
      lowStockThreshold: hint?.lowStockThreshold ?? 20,
      leadTime: hint?.leadTime,
      paused: false,
      lastUpdated: Date.now(),
    };
  return { ...base, ...hint };
}

// -------- Public API --------

export function getInventory(productId: string, hint?: Partial<InventoryRecord>): InventoryRecord {
  const all = readInv();
  return all[productId] ?? defaultRecordFor(productId, hint);
}

export function saveInventory(rec: InventoryRecord) {
  const all = { ...readInv() };
  all[rec.productId] = { ...rec, lastUpdated: Date.now() };
  writeInv(all);
  const tracking =
    rec.trackingType === "exact"
      ? "tracked"
      : rec.trackingType === "made_to_order"
        ? "made_to_order"
        : rec.trackingType === "unlimited"
          ? "unlimited"
          : "tracked";
  void import("@/services/products").then(({ upsertProductInventory }) =>
    upsertProductInventory({
      productId: rec.productId,
      available: rec.available,
      reserved: rec.reserved,
      incoming: rec.incoming,
      lowStockThreshold: rec.lowStockThreshold,
      trackingType: tracking,
      paused: rec.paused,
      restockDate: rec.restockDate ?? null,
      leadTime: rec.leadTime ?? null,
      note: "inventory sync",
    }),
  );
}

export function useInventoryMap(): Record<string, InventoryRecord> {
  return useSyncExternalStore(subscribe, readInv, () => EMPTY_INV);
}

export function useInventory(productId: string, hint?: Partial<InventoryRecord>): InventoryRecord {
  const map = useInventoryMap();
  return map[productId] ?? defaultRecordFor(productId, hint);
}

export function useMovements(productId?: string): Movement[] {
  const all = useSyncExternalStore(subscribe, readMov, () => EMPTY_MOV);
  return productId ? all.filter((m) => m.productId === productId) : all;
}

function pushMovement(m: Omit<Movement, "id" | "createdAt">) {
  const all = readMov();
  const next: Movement = {
    ...m,
    id: `mv_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  writeMov([next, ...all].slice(0, 500));
}

// -------- Status computation --------

export function computeStatus(rec: InventoryRecord): StockStatus {
  if (rec.paused) return "Paused";
  if (rec.trackingType === "made_to_order") return "Made to Order";
  if (rec.trackingType === "quote_only") return "Quote for Availability";
  if (rec.trackingType === "unlimited") return "In Stock";
  if (rec.available <= 0) return "Out of Stock";
  if (rec.available <= rec.lowStockThreshold) return "Low Stock";
  return "In Stock";
}

export function badgeForStatus(status: StockStatus): { label: string; className: string } {
  switch (status) {
    case "In Stock":            return { label: "In Stock",              className: "bg-success/15 text-success border-success/30" };
    case "Low Stock":           return { label: "Low Stock",             className: "bg-amber-100 text-amber-800 border-amber-300" };
    case "Out of Stock":        return { label: "Out of Stock",          className: "bg-destructive/10 text-destructive border-destructive/30" };
    case "Made to Order":       return { label: "Made to Order",         className: "bg-primary/10 text-primary border-primary/30" };
    case "Quote for Availability": return { label: "Check Availability", className: "bg-muted text-foreground border-border" };
    case "Paused":              return { label: "Paused",                className: "bg-muted text-muted-foreground border-border" };
  }
}

// -------- Mutations --------

export function adjustStock(
  productId: string,
  delta: number,
  reason?: string,
  createdBy?: string,
) {
  const rec = getInventory(productId);
  const prev = rec.available;
  const next = Math.max(0, prev + delta);
  saveInventory({ ...rec, available: next });
  pushMovement({
    productId,
    type: delta >= 0 ? "add_stock" : "reduce_stock",
    quantityChange: delta,
    previousStock: prev,
    newStock: next,
    reason,
    createdBy,
  });
}

export function setStockValue(productId: string, value: number, reason?: string) {
  const rec = getInventory(productId);
  const prev = rec.available;
  const next = Math.max(0, Math.floor(value));
  saveInventory({ ...rec, available: next });
  pushMovement({
    productId,
    type: "manual_adjust",
    quantityChange: next - prev,
    previousStock: prev,
    newStock: next,
    reason: reason ?? "Manual set",
  });
}

export function setTrackingType(productId: string, type: StockTrackingType) {
  const rec = getInventory(productId);
  saveInventory({ ...rec, trackingType: type, paused: false });
  pushMovement({
    productId, type: "status_change", quantityChange: 0,
    previousStock: rec.available, newStock: rec.available,
    reason: `Tracking set to ${type}`,
  });
}

export function markOutOfStock(productId: string) {
  const rec = getInventory(productId);
  const prev = rec.available;
  saveInventory({ ...rec, available: 0, trackingType: rec.trackingType === "unlimited" ? "exact" : rec.trackingType, paused: false });
  pushMovement({
    productId, type: "marked_out", quantityChange: -prev, previousStock: prev, newStock: 0,
    reason: "Marked out of stock",
  });
}

export function markInStock(productId: string, qty: number) {
  const rec = getInventory(productId);
  const prev = rec.available;
  const next = Math.max(qty, rec.lowStockThreshold + 1);
  saveInventory({ ...rec, available: next, trackingType: "exact", paused: false });
  pushMovement({
    productId, type: "marked_in", quantityChange: next - prev, previousStock: prev, newStock: next,
    reason: "Marked in stock",
  });
}

export function setPaused(productId: string, paused: boolean) {
  const rec = getInventory(productId);
  saveInventory({ ...rec, paused });
  pushMovement({
    productId, type: "status_change", quantityChange: 0,
    previousStock: rec.available, newStock: rec.available,
    reason: paused ? "Listing paused" : "Listing resumed",
  });
}

export function setLowStockThreshold(productId: string, threshold: number) {
  const rec = getInventory(productId);
  saveInventory({ ...rec, lowStockThreshold: Math.max(0, Math.floor(threshold)) });
}

export function setIncoming(productId: string, incoming: number, restockDate?: string) {
  const rec = getInventory(productId);
  saveInventory({ ...rec, incoming: Math.max(0, Math.floor(incoming)), restockDate });
}

// -------- Reservation lifecycle --------

export function reserveStock(productId: string, qty: number, orderId?: string) {
  const rec = getInventory(productId);
  if (rec.trackingType !== "exact") return { ok: true, partial: false };
  const take = Math.min(qty, rec.available);
  const prev = rec.available;
  const next = prev - take;
  saveInventory({ ...rec, available: next, reserved: rec.reserved + take });
  pushMovement({
    productId, type: "order_reserved", quantityChange: -take,
    previousStock: prev, newStock: next,
    reason: `Reserved for order`, relatedOrderId: orderId,
  });
  return { ok: take === qty, partial: take < qty, reserved: take };
}

export function releaseReservation(productId: string, qty: number, orderId?: string) {
  const rec = getInventory(productId);
  if (rec.trackingType !== "exact") return;
  const back = Math.min(qty, rec.reserved);
  const prev = rec.available;
  const next = prev + back;
  saveInventory({ ...rec, available: next, reserved: rec.reserved - back });
  pushMovement({
    productId, type: "order_cancelled", quantityChange: back,
    previousStock: prev, newStock: next,
    reason: `Order cancelled — stock returned`, relatedOrderId: orderId,
  });
}

export function completeReservation(productId: string, qty: number, orderId?: string) {
  const rec = getInventory(productId);
  if (rec.trackingType !== "exact") return;
  const done = Math.min(qty, rec.reserved);
  saveInventory({ ...rec, reserved: rec.reserved - done });
  pushMovement({
    productId, type: "order_completed", quantityChange: 0,
    previousStock: rec.available, newStock: rec.available,
    reason: `Order completed — reservation cleared`, relatedOrderId: orderId,
  });
}

// -------- Helpers for UI --------

export function stockDisplayText(rec: InventoryRecord): string {
  const s = computeStatus(rec);
  switch (s) {
    case "In Stock":    return `In Stock: ${rec.available.toLocaleString()} ${rec.unit}`;
    case "Low Stock":   return `Low Stock: ${rec.available} ${rec.unit} left`;
    case "Out of Stock":return `Out of Stock${rec.restockDate ? ` — restock ${rec.restockDate}` : ""}`;
    case "Made to Order": return `Made to Order${rec.leadTime ? ` · ${rec.leadTime}` : ""}`;
    case "Quote for Availability": return "Check availability";
    case "Paused": return "Currently unavailable";
  }
}

export function lowStockList(supplierId?: string) {
  const map = readInv();
  const items = Object.values(map).filter((r) => {
    if (supplierId && r.supplierId && r.supplierId !== supplierId) return false;
    const s = computeStatus(r);
    return s === "Low Stock" || s === "Out of Stock";
  });
  return items;
}
