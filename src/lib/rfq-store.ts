// Prototype RFQ store — localStorage, reference-stable via useSyncExternalStore.
// Mirrors the pattern in src/lib/cart.ts.

import { useSyncExternalStore } from "react";
import type { RFQ, RFQStatus } from "./mock-data";
import { rfqs as seedRfqs } from "./mock-data";

const RFQ_KEY = "psg_rfqs_v1";
const isBrowser = typeof window !== "undefined";
const storageCache = new Map<string, { raw: string; value: unknown }>();
const EMPTY: RFQ[] = [];

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
  window.dispatchEvent(new CustomEvent("psg-rfq-change"));
}

const listeners = new Set<() => void>();
if (isBrowser) {
  window.addEventListener("psg-rfq-change", () => listeners.forEach((l) => l()));
  window.addEventListener("storage", () => listeners.forEach((l) => l()));
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getOverrides(): RFQ[] {
  return read<RFQ[]>(RFQ_KEY, EMPTY);
}

/** Merged view: seed rfqs + any custom created/edited overrides. */
export function getAllRfqs(): RFQ[] {
  const overrides = getOverrides();
  const byId = new Map<string, RFQ>();
  for (const r of seedRfqs) byId.set(r.id, r);
  for (const r of overrides) byId.set(r.id, r);
  return Array.from(byId.values()).sort((a, b) => (b.id > a.id ? 1 : -1));
}

export function getRfq(id: string): RFQ | undefined {
  return getAllRfqs().find((r) => r.id === id);
}

export function saveRfq(rfq: RFQ) {
  const all = getOverrides();
  const i = all.findIndex((r) => r.id === rfq.id);
  if (i >= 0) all[i] = rfq;
  else all.unshift(rfq);
  write(RFQ_KEY, all);
}

export function updateRfqStatus(id: string, status: RFQStatus, extra?: Partial<RFQ>) {
  const current = getRfq(id);
  if (!current) return;
  saveRfq({ ...current, ...extra, status });
}

export function selectSupplier(id: string, supplierId: string) {
  const current = getRfq(id);
  if (!current) return;
  saveRfq({ ...current, status: "Supplier Selected", selectedSupplierId: supplierId, nextAction: "Supplier selected — Create order" });
}

export function appendQuote(id: string, quote: RFQ["quotes"][number]) {
  const current = getRfq(id);
  if (!current) return;
  const nextQuotes = [...current.quotes, quote];
  saveRfq({ ...current, quotes: nextQuotes, responses: (current.responses || 0) + 1 });
}

export function useAllRfqs(): RFQ[] {
  return useSyncExternalStore(subscribe, getAllRfqs, () => seedRfqs);
}
export function useRfq(id: string): RFQ | undefined {
  return useSyncExternalStore(subscribe, () => getRfq(id), () => seedRfqs.find((r) => r.id === id));
}

export function newRfqId(): string {
  const n = Math.floor(Date.now() / 1000) % 1000000;
  return `rfq_d${n}`;
}
