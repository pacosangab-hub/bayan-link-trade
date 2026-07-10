// Smart search + filter helpers (client-only, mock-data driven).
import { useEffect, useState } from "react";
import { products as MOCK_PRODUCTS, suppliers as MOCK_SUPPLIERS, categories as MOCK_CATEGORIES } from "@/lib/mock-data";
import type { Product, Supplier } from "@/lib/mock-data";

// ---- Aliases / synonyms (Filipino + common terms)
export const ALIASES: Record<string, string[]> = {
  rice: ["bigas", "grains", "well-milled", "jasmine", "sinandomeng", "rice & grains"],
  cement: ["construction", "concrete", "hollow blocks", "bricks"],
  coffee: ["beans", "espresso", "barako", "cold brew", "beverages"],
  packaging: ["boxes", "bottles", "labels", "pouches", "cartons", "sacks", "pet"],
  medicine: ["pharma", "paracetamol", "medical supplies", "pharma & health"],
  cleaning: ["detergent", "bleach", "hygiene", "sanitizer", "dishwashing"],
  hotel: ["towels", "linens", "amenities", "hospitality"],
  restaurant: ["kitchen", "foodservice", "supplies"],
  logistics: ["delivery", "trucking", "transport"],
  mask: ["medical masks", "ppe", "face mask"],
  bottle: ["pet bottles", "packaging"],
  paper: ["disposables", "tissue"],
  seafood: ["fish", "tilapia", "bangus", "isda"],
};

function expandQuery(q: string): string[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const tokens = new Set<string>([s]);
  for (const [k, list] of Object.entries(ALIASES)) {
    if (s.includes(k) || list.some((a) => s.includes(a))) {
      tokens.add(k);
      list.forEach((a) => tokens.add(a));
    }
  }
  return Array.from(tokens);
}

function tokenMatch(hay: string, needles: string[]): boolean {
  const h = hay.toLowerCase();
  return needles.some((n) => n && h.includes(n));
}

// Fuzzy: allow one-char typo per short word
function looseMatch(hay: string, q: string) {
  const h = hay.toLowerCase();
  const s = q.toLowerCase();
  if (h.includes(s)) return true;
  if (s.length < 4) return false;
  // typo tolerance
  const trimmed = s.slice(0, -1);
  return h.includes(trimmed);
}

// ---- Recent searches (localStorage)
const RECENT_KEY = "psg_recent_searches_v1";
export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}
export function pushRecent(q: string) {
  if (typeof window === "undefined" || !q.trim()) return;
  const list = getRecent().filter((x) => x.toLowerCase() !== q.toLowerCase());
  list.unshift(q.trim());
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  window.dispatchEvent(new Event("psg-recent"));
}
export function clearRecent() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_KEY);
  window.dispatchEvent(new Event("psg-recent"));
}
export function useRecent() {
  const [r, setR] = useState<string[]>(() => getRecent());
  useEffect(() => {
    const h = () => setR(getRecent());
    window.addEventListener("psg-recent", h);
    return () => window.removeEventListener("psg-recent", h);
  }, []);
  return r;
}

export const RECOMMENDED_SEARCHES = [
  "Rice suppliers",
  "Packaging boxes",
  "Coffee beans",
  "Cement supplier",
  "Hotel towels",
  "Medical masks",
  "Dishwashing liquid",
  "PET bottles",
  "POS terminals",
  "Office supplies",
];

export const POPULAR_CATEGORY_NAMES = [
  "Food & FMCG",
  "Agriculture",
  "Packaging",
  "Construction",
  "Cleaning & Hygiene",
  "Hotel & Restaurant Supplies",
];

// ---- Suggestions
export type Suggestion =
  | { kind: "product"; id: string; label: string; sub?: string }
  | { kind: "supplier"; id: string; label: string; sub?: string }
  | { kind: "category"; name: string; label: string }
  | { kind: "related"; label: string }
  | { kind: "action"; label: string; to: string };

export function suggest(query: string, limit = 12): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const needles = expandQuery(q);

  const productHits: Suggestion[] = [];
  for (const p of MOCK_PRODUCTS) {
    const hay = `${p.title} ${p.category} ${p.industry ?? ""} ${(p.tags ?? []).join(" ")} ${p.description}`;
    if (tokenMatch(hay, needles) || looseMatch(p.title, q)) {
      productHits.push({ kind: "product", id: p.id, label: p.title, sub: p.category });
      if (productHits.length >= 5) break;
    }
  }

  const supplierHits: Suggestion[] = [];
  for (const s of MOCK_SUPPLIERS) {
    const hay = `${s.name} ${s.categories.join(" ")} ${s.location} ${s.type}`;
    if (tokenMatch(hay, needles) || looseMatch(s.name, q)) {
      supplierHits.push({ kind: "supplier", id: s.id, label: s.name, sub: `${s.type} · ${s.location}` });
      if (supplierHits.length >= 3) break;
    }
  }

  const catHits: Suggestion[] = [];
  for (const c of MOCK_CATEGORIES) {
    if (tokenMatch(c.name, needles) || looseMatch(c.name, q)) {
      catHits.push({ kind: "category", name: c.name, label: c.name });
      if (catHits.length >= 4) break;
    }
  }

  const related: Suggestion[] = [];
  for (const [k, list] of Object.entries(ALIASES)) {
    if (q.includes(k) || list.some((a) => a.includes(q) || q.includes(a))) {
      list.slice(0, 4).forEach((r) => related.push({ kind: "related", label: r }));
    }
    if (related.length >= 4) break;
  }

  const action: Suggestion[] = [{ kind: "action", label: `Request quotes for “${query.trim()}”`, to: "/rfq/new" }];

  return [...productHits, ...supplierHits, ...catHits, ...related.slice(0, 4), ...action].slice(0, limit + 6);
}

// ---- Full search (results page)
export type SearchHit = {
  products: { product: Product; supplier: Supplier | null }[];
  suppliers: Supplier[];
  categories: string[];
  related: string[];
};

export function fullSearch(query: string): SearchHit {
  const q = query.trim().toLowerCase();
  const needles = expandQuery(q);
  if (!q) return { products: [], suppliers: [], categories: [], related: [] };

  const products = MOCK_PRODUCTS.filter((p) => {
    const hay = `${p.title} ${p.category} ${p.industry ?? ""} ${(p.tags ?? []).join(" ")} ${p.description} ${p.origin}`;
    return tokenMatch(hay, needles) || looseMatch(p.title, q);
  }).map((p) => ({
    product: p,
    supplier: MOCK_SUPPLIERS.find((s) => s.id === p.supplierId) ?? null,
  }));

  const suppliers = MOCK_SUPPLIERS.filter((s) => {
    const hay = `${s.name} ${s.categories.join(" ")} ${s.location} ${s.type} ${s.description}`;
    return tokenMatch(hay, needles) || looseMatch(s.name, q);
  });

  const categories = MOCK_CATEGORIES.filter((c) => tokenMatch(c.name, needles) || looseMatch(c.name, q)).map((c) => c.name);

  const related = new Set<string>();
  for (const [k, list] of Object.entries(ALIASES)) {
    if (q.includes(k) || list.some((a) => a.includes(q) || q.includes(a))) {
      list.forEach((r) => related.add(r));
    }
  }

  return { products, suppliers, categories, related: Array.from(related).slice(0, 8) };
}

// ---- Filter option constants
export const CATEGORY_CHIPS = [
  "Food & FMCG", "Agriculture", "Beverages", "Packaging", "Construction",
  "Cleaning", "Pharma & Health", "Hotel Supplies", "Restaurant Supplies",
  "IT & Telecom", "Logistics", "Office Supplies", "Automotive", "Beauty & Wellness",
];

export const SUPPLIER_TYPE_CHIPS = [
  "Manufacturer", "Distributor", "Wholesaler", "Farmer / Co-op",
  "Importer", "Service Provider", "Logistics Provider",
];

export const REGION_CHIPS = [
  "NCR", "CALABARZON", "Central Luzon", "Central Visayas",
  "Davao Region", "Western Visayas", "Northern Mindanao",
];

export const TRUST_CHIPS = [
  "Verified only", "Gold Supplier", "Escrow Ready", "Product Docs Verified", "High Rated",
];

export const BUYING_CHIPS = [
  "Fixed Price", "Request Quote", "Bulk Order", "Recurring Supply", "Custom Product", "Sample Available",
];

export const DELIVERY_CHIPS = [
  "Same day", "1–3 days", "3–7 days", "1–2 weeks", "Made to order",
];

export const ORDER_SIZE_CHIPS = [
  "Low MOQ", "Medium MOQ", "Bulk MOQ", "Container / Pallet",
];

export const COMPLIANCE_CHIPS = [
  "Food Docs Required", "FDA Docs Required", "Medical Docs Required",
  "Chemical Review Required", "No compliance needed",
];

export const QUICK_FILTERS = [
  "Verified only", "Escrow Ready", "Low MOQ", "Request Quote", "Fast Delivery", "Near NCR", "Gold Suppliers",
];

export const SORT_OPTIONS = [
  "Best Match", "Verified First", "Lowest Price", "Highest Rated", "Fastest Delivery", "Newest Listings",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

// ---- Filter matcher applied to a product+supplier pair
export function matchFilters(
  { product, supplier }: { product: Product; supplier: Supplier | null | { rating?: number; verification_status?: string; location?: string } },
  f: {
    categories?: string[];
    supplierTypes?: string[];
    regions?: string[];
    trust?: string[];
    buying?: string[];
    delivery?: string[];
    orderSize?: string[];
    compliance?: string[];
    quick?: string[];
  }
): boolean {
  const sup: any = supplier || {};
  const supName = sup.business_name ?? sup.name ?? "";
  const supLoc = sup.location ?? "";
  const supRating = sup.rating ?? 0;
  const supVerified = sup.verified ?? sup.verification_status === "verified";
  const supGold = sup.goldSupplier === true;
  const supType = sup.type ?? "";
  const supRegion = sup.region ?? "";

  const inAny = (list: string[] | undefined, test: (v: string) => boolean) =>
    !list || list.length === 0 || list.some(test);

  if (!inAny(f.categories, (c) => product.category?.toLowerCase().includes(c.toLowerCase().split(" ")[0]) || (product.industry ?? "").toLowerCase().includes(c.toLowerCase().split(" ")[0]))) return false;
  if (!inAny(f.supplierTypes, (t) => (supType || "").toLowerCase().includes(t.split(" ")[0].toLowerCase()))) return false;
  if (!inAny(f.regions, (r) => (supRegion + " " + supLoc + " " + product.origin).toLowerCase().includes(r.toLowerCase()))) return false;

  if (f.trust && f.trust.length) {
    for (const t of f.trust) {
      if (t === "Verified only" && !supVerified) return false;
      if (t === "Gold Supplier" && !supGold) return false;
      if (t === "High Rated" && supRating < 4.5) return false;
      // Escrow / Docs Verified — every verified supplier passes in demo
      if ((t === "Escrow Ready" || t === "Product Docs Verified") && !supVerified) return false;
    }
  }

  if (f.buying && f.buying.length) {
    for (const b of f.buying) {
      if (b === "Fixed Price" && !(product.pricePhp > 0)) return false;
      if (b === "Request Quote" && product.pricePhp > 0) return false;
      if (b === "Bulk Order" && product.moq < 20) return false;
      if (b === "Sample Available" && product.moq > 5) return false;
      // Recurring / Custom — allow all (demo)
    }
  }

  if (f.delivery && f.delivery.length) {
    const lt = product.leadTimeDays;
    const ok = f.delivery.some((d) => {
      if (d === "Same day") return lt <= 1;
      if (d === "1–3 days") return lt >= 1 && lt <= 3;
      if (d === "3–7 days") return lt >= 3 && lt <= 7;
      if (d === "1–2 weeks") return lt >= 7 && lt <= 14;
      if (d === "Made to order") return lt >= 10;
      return true;
    });
    if (!ok) return false;
  }

  if (f.orderSize && f.orderSize.length) {
    const ok = f.orderSize.some((s) => {
      if (s === "Low MOQ") return product.moq <= 10;
      if (s === "Medium MOQ") return product.moq > 10 && product.moq <= 50;
      if (s === "Bulk MOQ") return product.moq > 50 && product.moq <= 200;
      if (s === "Container / Pallet") return product.moq > 200;
      return false;
    });
    if (!ok) return false;
  }

  if (f.compliance && f.compliance.length) {
    const c = (product.compliance ?? "").toLowerCase();
    const ok = f.compliance.some((x) => {
      if (x === "No compliance needed") return !product.compliance;
      return c.includes(x.split(" ")[0].toLowerCase());
    });
    if (!ok) return false;
  }

  if (f.quick && f.quick.length) {
    for (const q of f.quick) {
      if (q === "Verified only" && !supVerified) return false;
      if (q === "Gold Suppliers" && !supGold) return false;
      if (q === "Low MOQ" && product.moq > 10) return false;
      if (q === "Request Quote" && product.pricePhp > 0) return false;
      if (q === "Fast Delivery" && product.leadTimeDays > 3) return false;
      if (q === "Near NCR" && !(supLoc.includes("Manila") || supRegion.includes("NCR") || product.origin.includes("Manila"))) return false;
      if (q === "Escrow Ready" && !supVerified) return false;
    }
  }
  // touch supName to avoid unused
  void supName;
  return true;
}

export function sortResults<T extends { product: Product; supplier: any }>(
  list: T[],
  sort: SortOption,
  q?: string,
): T[] {
  const arr = [...list];
  const query = (q ?? "").toLowerCase();
  switch (sort) {
    case "Lowest Price":
      return arr.sort((a, b) => (a.product.pricePhp || Infinity) - (b.product.pricePhp || Infinity));
    case "Highest Rated":
      return arr.sort((a, b) => (b.supplier?.rating ?? 0) - (a.supplier?.rating ?? 0));
    case "Fastest Delivery":
      return arr.sort((a, b) => a.product.leadTimeDays - b.product.leadTimeDays);
    case "Verified First":
      return arr.sort((a, b) => Number(!!b.supplier?.verified || b.supplier?.verification_status === "verified") - Number(!!a.supplier?.verified || a.supplier?.verification_status === "verified"));
    case "Newest Listings":
      return arr.reverse();
    case "Best Match":
    default:
      return arr.sort((a, b) => {
        const score = (x: T) => {
          let s = 0;
          if (query && x.product.title.toLowerCase().includes(query)) s += 5;
          if (x.supplier?.verified || x.supplier?.verification_status === "verified") s += 3;
          s += (x.supplier?.rating ?? 0);
          return s;
        };
        return score(b) - score(a);
      });
  }
}
