// Delivery methods, statuses, and per-order localStorage overlay.
// Kept intentionally small — B2B-friendly, not enterprise logistics.
import { useSyncExternalStore } from "react";

export type DeliveryMethod =
  | "pickup_warehouse"
  | "third_party_carrier"
  | "supplier_owned_logistics"
  | "open_to_supplier";

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  pickup_warehouse: "Pick Up at Warehouse",
  third_party_carrier: "Third-Party Carrier with Tracking",
  supplier_owned_logistics: "Supplier-Owned Logistics",
  open_to_supplier: "Open to Supplier Recommendation",
};

export const DELIVERY_METHOD_BADGES: Record<DeliveryMethod, string> = {
  pickup_warehouse: "Pickup",
  third_party_carrier: "3rd-Party Tracking",
  supplier_owned_logistics: "Supplier Logistics",
  open_to_supplier: "Open",
};

export const DELIVERY_METHOD_OPTIONS: { value: DeliveryMethod; label: string; blurb: string }[] = [
  { value: "pickup_warehouse", label: "Pick Up at Warehouse", blurb: "Buyer picks up from the supplier's warehouse." },
  { value: "third_party_carrier", label: "Third-Party Carrier with Tracking", blurb: "Delivered by a logistics provider with tracking." },
  { value: "supplier_owned_logistics", label: "Supplier-Owned Logistics", blurb: "Delivered using the supplier's own fleet." },
];

export type DeliveryStatus =
  | "pending_method_selection"
  | "pickup_scheduled"
  | "ready_for_pickup"
  | "picked_up"
  | "carrier_pending"
  | "handed_to_carrier"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "buyer_confirmed"
  | "completed"
  | "delayed"
  | "disputed";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending_method_selection: "Awaiting Method",
  pickup_scheduled: "Pickup Scheduled",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  carrier_pending: "Awaiting Carrier",
  handed_to_carrier: "Handed to Carrier",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  buyer_confirmed: "Buyer Confirmed",
  completed: "Completed",
  delayed: "Delayed",
  disputed: "Disputed",
};

export function deliveryStatusTone(s: DeliveryStatus): string {
  if (s === "delivered" || s === "buyer_confirmed" || s === "completed") return "chip-verified";
  if (s === "delayed" || s === "disputed") return "chip-primary";
  return "chip-gold";
}

export interface DeliveryDetails {
  pickup_address?: string;
  pickup_contact_person?: string;
  pickup_contact_number?: string;
  pickup_date?: string;
  pickup_time_window?: string;
  carrier_name?: string;
  tracking_number?: string;
  tracking_link?: string;
  shipping_date?: string;
  eta?: string;
  delivery_address?: string;
  delivery_contact_person?: string;
  delivery_contact_number?: string;
  delivery_date?: string;
  delivery_time_window?: string;
  delivery_fee?: number;
  driver_name?: string;
  driver_contact?: string;
  vehicle_plate_number?: string;
  delivery_notes?: string;
}

export interface DeliveryProof {
  type: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
  note?: string;
}

export interface OrderDelivery {
  method: DeliveryMethod;
  status: DeliveryStatus;
  details: DeliveryDetails;
  proofs: DeliveryProof[];
}

const KEY = "psg-order-deliveries";
const EVT = "psg-delivery-change";
const isBrowser = typeof window !== "undefined";

function readAll(): Record<string, OrderDelivery> {
  if (!isBrowser) return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; }
}
function writeAll(map: Record<string, OrderDelivery>) {
  if (!isBrowser) return;
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function getOrderDelivery(id: string): OrderDelivery | null {
  return readAll()[id] || null;
}

export function setOrderDelivery(id: string, d: OrderDelivery) {
  const map = readAll();
  map[id] = d;
  writeAll(map);
}

export function updateOrderDelivery(id: string, patch: Partial<OrderDelivery>) {
  const map = readAll();
  const cur = map[id] || { method: "supplier_owned_logistics", status: "pending_method_selection", details: {}, proofs: [] } as OrderDelivery;
  map[id] = { ...cur, ...patch, details: { ...cur.details, ...(patch.details || {}) } };
  writeAll(map);
}

// Seed demo deliveries so buyer portal shows realistic data.
export function seedDemoDeliveries() {
  if (!isBrowser) return;
  const map = readAll();
  const seeds: Record<string, OrderDelivery> = {
    ord_24011: {
      method: "supplier_owned_logistics",
      status: "pickup_scheduled",
      details: {
        delivery_address: "8 branches — Metro Manila",
        delivery_contact_person: "Stefano San Gabriel",
        delivery_contact_number: "+63 917 000 0000",
        delivery_date: "2026-07-18",
        delivery_time_window: "8:00 AM – 12:00 NN",
        delivery_fee: 1500,
        driver_name: "Mang Ramon",
        driver_contact: "+63 917 555 0011",
        vehicle_plate_number: "NGY 4421",
        delivery_notes: "Deliver to commissary loading dock, ask for Chef Paco.",
      },
      proofs: [],
    },
    ord_24008: {
      method: "third_party_carrier",
      status: "in_transit",
      details: {
        carrier_name: "LBC Express",
        tracking_number: "LBC123456789",
        tracking_link: "https://www.lbcexpress.com/track/?tracking_no=LBC123456789",
        shipping_date: "2026-07-14",
        eta: "2026-07-16",
        delivery_fee: 850,
      },
      proofs: [],
    },
    ord_23994: {
      method: "pickup_warehouse",
      status: "ready_for_pickup",
      details: {
        pickup_address: "Silang, Cavite Warehouse — Km 42 Aguinaldo Hwy",
        pickup_contact_person: "Roasters Ops",
        pickup_contact_number: "+63 917 222 0033",
        pickup_date: "2026-07-17",
        pickup_time_window: "9:00 AM – 5:00 PM",
      },
      proofs: [],
    },
  };
  let changed = false;
  for (const [id, seed] of Object.entries(seeds)) {
    if (!map[id]) { map[id] = seed; changed = true; }
  }
  if (changed) writeAll(map);
}

function subscribe(cb: () => void) {
  if (!isBrowser) return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", h);
  return () => { window.removeEventListener(EVT, h); window.removeEventListener("storage", h); };
}

export function useOrderDelivery(id: string): OrderDelivery | null {
  return useSyncExternalStore(subscribe, () => getOrderDelivery(id), () => null);
}

export function useAllDeliveries(): Record<string, OrderDelivery> {
  return useSyncExternalStore(subscribe, readAll, () => ({}));
}
