// Custom Requests + Custom Offers (Supplier Proposals)
// Client-only prototype store, backed by localStorage. Mirrors cart.ts pattern.
import { useSyncExternalStore } from "react";
import { suppliers, supplierById, products, formatPhp } from "./mock-data";
import { escrowOrder, saveDemoOrder, type DemoOrder } from "./cart";
import { reserveStock } from "./inventory";

export type RequestStatus =
  | "New Request"
  | "Waiting for Supplier Offer"
  | "Custom Offer Sent"
  | "Buyer Requested Changes"
  | "Accepted"
  | "Rejected"
  | "Converted to Order"
  | "Expired";

export type OfferStatus =
  | "Pending Review"
  | "Accepted"
  | "Changes Requested"
  | "Rejected"
  | "Expired"
  | "Converted to Order";

export type CustomRequest = {
  id: string;
  createdAt: string;
  buyer: string;
  buyerBusiness: string;
  buyerType: string;
  supplierId: string;
  productName: string;
  category: string;
  industry: string;
  qty: number;
  unit: string;
  budgetPhp: number;
  deliveryLocation: string;
  neededBy: string;
  recurring: "One-time" | "Weekly" | "Monthly" | "Custom";
  requirements: string;
  packaging: string;
  certifications: string;
  deliveryRequirements: string;
  message: string;
  attachments: string[];
  status: RequestStatus;
  offerIds: string[];
};

export type OfferVersion = {
  version: number;
  createdAt: string;
  unitPrice: number;
  totalPrice: number;
  leadTimeDays: number;
  deliveryFee: number;
  notes: string;
};

export type TimelineEntry = {
  at: string;
  actor: "buyer" | "supplier" | "system";
  label: string;
};

export type CustomOffer = {
  id: string;
  requestId: string;
  createdAt: string;
  supplierId: string;
  buyerBusiness: string;
  productName: string;
  category: string;
  industry: string;
  title: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  moq: number;
  leadTimeDays: number;
  deliveryFee: number;
  deliverySchedule: string;
  deliveryLocation: string;
  neededBy: string;
  paymentTerms: string;
  escrowAvailable: boolean;
  validUntil: string;
  stock: string;
  warranty: string;
  certifications: string;
  notes: string;
  attachments: string[];
  breakdown: { product: number; delivery: number; platform: number; vat: number; total: number };
  recurring?: { enabled: boolean; schedule: string; duration: string; priceLockMonths: number };
  status: OfferStatus;
  version: number;
  versions: OfferVersion[];
  timeline: TimelineEntry[];
  orderId?: string;
};

const REQS_KEY = "psg_custom_requests_v1";
const OFFERS_KEY = "psg_custom_offers_v1";

const isBrowser = typeof window !== "undefined";
const cache = new Map<string, { raw: string; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const c = cache.get(key);
    if (c?.raw === raw) return c.value as T;
    const v = JSON.parse(raw) as T;
    cache.set(key, { raw, value: v });
    return v;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  if (!isBrowser) return;
  const raw = JSON.stringify(val);
  cache.set(key, { raw, value: val });
  localStorage.setItem(key, raw);
  window.dispatchEvent(new CustomEvent("psg-offers-change"));
}

const listeners = new Set<() => void>();
if (isBrowser) {
  window.addEventListener("psg-offers-change", () => listeners.forEach((l) => l()));
  window.addEventListener("storage", () => listeners.forEach((l) => l()));
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ---------- Demo seeds ----------
const now = () => new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

function seed() {
  if (!isBrowser) return;
  if (localStorage.getItem(REQS_KEY) && localStorage.getItem(OFFERS_KEY)) return;

  const reqs: CustomRequest[] = [
    {
      id: "req_001", createdAt: "2 hrs ago",
      buyer: "buyer_1", buyerBusiness: "Lola Nena's Carinderia Group", buyerType: "Carinderia chain",
      supplierId: "sup_001",
      productName: "Premium well-milled rice, 500 kg/month",
      category: "Rice & Grains", industry: "Food Manufacturing & FMCG",
      qty: 500, unit: "kg", budgetPhp: 23000,
      deliveryLocation: "Quezon City, Metro Manila",
      neededBy: "Start Nov 15, 2026 · weekly",
      recurring: "Monthly",
      requirements: "Consistent grade, low broken %, uniform grain length",
      packaging: "25 kg PP sacks, resealable",
      certifications: "NFA registered miller preferred",
      deliveryRequirements: "Deliver Mondays 6-9 AM to 8 branches",
      message: "Please quote 6-month recurring supply. Open to price lock.",
      attachments: ["nena_purchase_history.pdf"],
      status: "Custom Offer Sent", offerIds: ["off_001"],
    },
    {
      id: "req_002", createdAt: "5 hrs ago",
      buyer: "buyer_2", buyerBusiness: "Bahay Kubo Snacks Co.", buyerType: "Small food manufacturer",
      supplierId: "sup_007",
      productName: "5,000 custom kraft boxes with logo print",
      category: "Packaging", industry: "Packaging Materials",
      qty: 5000, unit: "boxes", budgetPhp: 45000,
      deliveryLocation: "Valenzuela City",
      neededBy: "In 3 weeks",
      recurring: "One-time",
      requirements: "300 gsm kraft, food-grade, dieline attached, 1-color logo print",
      packaging: "Flat-pack in bundles of 100",
      certifications: "Food-contact safe",
      deliveryRequirements: "Deliver to warehouse, forklift-accessible",
      message: "First run. If quality good, we'll switch permanently.",
      attachments: ["logo.ai", "dieline.pdf"],
      status: "Waiting for Supplier Offer", offerIds: [],
    },
    {
      id: "req_003", createdAt: "1 day ago",
      buyer: "buyer_3", buyerBusiness: "BGC Renovate Contractors", buyerType: "Contractor",
      supplierId: "sup_004",
      productName: "Cement & ceramic floor tiles for BGC condo reno",
      category: "Construction", industry: "Construction Materials",
      qty: 1, unit: "project", budgetPhp: 200000,
      deliveryLocation: "BGC, Taguig",
      neededBy: "Within 7 days",
      recurring: "One-time",
      requirements: "200 bags Portland cement, 600 sqm porcelain tile 60x60 matte gray",
      packaging: "Standard pallet",
      certifications: "PS mark on cement",
      deliveryRequirements: "3 truck deliveries, staggered per unit floor",
      message: "Need itemized quote and delivery schedule.",
      attachments: [],
      status: "New Request", offerIds: [],
    },
    {
      id: "req_004", createdAt: "2 days ago",
      buyer: "buyer_4", buyerBusiness: "Kalinga Beauty Reseller Co.", buyerType: "Cosmetics reseller",
      supplierId: "sup_005",
      productName: "Private-label soap & skincare packaging",
      category: "Personal Care", industry: "Personal Care & Cosmetics",
      qty: 2000, unit: "units", budgetPhp: 130000,
      deliveryLocation: "Cebu City",
      neededBy: "Within 45 days",
      recurring: "Custom",
      requirements: "White-label bar soap + serum bottles, custom label print",
      packaging: "Individual box + shrink wrap",
      certifications: "FDA CPR ready",
      deliveryRequirements: "Air freight to Cebu",
      message: "Include FDA docs placeholder in quote.",
      attachments: [],
      status: "Buyer Requested Changes", offerIds: ["off_002"],
    },
    {
      id: "req_005", createdAt: "3 days ago",
      buyer: "buyer_5", buyerBusiness: "Hotel Antonio Group", buyerType: "Hotel chain",
      supplierId: "sup_003",
      productName: "Weekly vegetable & herb supply, 5 properties",
      category: "Vegetables", industry: "Agriculture & Fresh Produce",
      qty: 350, unit: "kg/week", budgetPhp: 40000,
      deliveryLocation: "Makati + BGC",
      neededBy: "Ongoing, Mon & Thu",
      recurring: "Weekly",
      requirements: "Mixed basket: lettuce, tomato, onion, herbs. HACCP-friendly cold chain.",
      packaging: "Sanitized crates",
      certifications: "Organic/GAP preferred",
      deliveryRequirements: "Chilled van, 5-7 AM cutoff",
      message: "Locked pricing for 3 months minimum.",
      attachments: [],
      status: "Converted to Order", offerIds: ["off_003"],
    },
    {
      id: "req_006", createdAt: "6 hrs ago",
      buyer: "buyer_6", buyerBusiness: "Sunrise Logistics Ph", buyerType: "Shipper",
      supplierId: "sup_006",
      productName: "One-way freight Bulacan → Quezon City",
      category: "Logistics", industry: "Logistics & Freight",
      qty: 1, unit: "trip", budgetPhp: 15000,
      deliveryLocation: "Bulacan → QC",
      neededBy: "Tomorrow",
      recurring: "One-time",
      requirements: "6-wheeler closed van, 4-ton cargo, fragile handling",
      packaging: "Palletized",
      certifications: "LTFRB",
      deliveryRequirements: "Pickup 8 AM Bulacan, deliver by 2 PM QC",
      message: "Rush.",
      attachments: [],
      status: "New Request", offerIds: [],
    },
  ];

  const offers: CustomOffer[] = [
    {
      id: "off_001", requestId: "req_001", createdAt: "1 hr ago",
      supplierId: "sup_001", buyerBusiness: "Lola Nena's Carinderia Group",
      productName: "Premium well-milled rice", category: "Rice & Grains", industry: "Food Manufacturing & FMCG",
      title: "Custom rice supply — 500 kg/month for 6 months",
      description: "Premium NFA-registered mill, low broken %, weekly delivery in 25 kg PP sacks.",
      qty: 500, unit: "kg",
      unitPrice: 46, totalPrice: 23000,
      moq: 250, leadTimeDays: 2, deliveryFee: 1200,
      deliverySchedule: "Every Monday, 6-9 AM", deliveryLocation: "Quezon City, Metro Manila",
      neededBy: "Start Nov 15, 2026",
      paymentTerms: "Escrow · net-7 for repeat orders",
      escrowAvailable: true,
      validUntil: "7 days from send",
      stock: "In stock, 12 tons available", warranty: "Free replacement for spoilage on arrival",
      certifications: "NFA registered · DA-BAFPS", notes: "Price locked for 6 months if agreement signed.",
      attachments: ["quotation_rice.pdf", "mill_cert.pdf"],
      breakdown: { product: 23000, delivery: 1200, platform: 727, vat: 2911, total: 27838 },
      recurring: { enabled: true, schedule: "Weekly", duration: "6 months", priceLockMonths: 6 },
      status: "Pending Review", version: 1,
      versions: [{ version: 1, createdAt: "1 hr ago", unitPrice: 46, totalPrice: 23000, leadTimeDays: 2, deliveryFee: 1200, notes: "Initial offer" }],
      timeline: [
        { at: "2 hrs ago", actor: "buyer", label: "Buyer sent custom request" },
        { at: "1 hr ago", actor: "supplier", label: "Supplier sent Custom Offer v1" },
      ],
    },
    {
      id: "off_002", requestId: "req_004", createdAt: "1 day ago",
      supplierId: "sup_005", buyerBusiness: "Kalinga Beauty Reseller Co.",
      productName: "Private-label soap & skincare packaging",
      category: "Personal Care", industry: "Personal Care & Cosmetics",
      title: "Private-label kit — 2,000 units",
      description: "1,000 bar soaps + 1,000 serum bottles, custom label print, FDA-ready docs.",
      qty: 2000, unit: "units", unitPrice: 60, totalPrice: 120000,
      moq: 2000, leadTimeDays: 30, deliveryFee: 3800,
      deliverySchedule: "Single air freight shipment", deliveryLocation: "Cebu City",
      neededBy: "Within 45 days",
      paymentTerms: "50% escrow on order, 50% on shipment",
      escrowAvailable: true, validUntil: "10 days from send",
      stock: "Made-to-order", warranty: "Replace defective units within 14 days",
      certifications: "FDA CPR placeholder", notes: "Please confirm label file format.",
      attachments: ["proposal_kalinga.pdf"],
      breakdown: { product: 120000, delivery: 3800, platform: 3714, vat: 15181, total: 142695 },
      status: "Changes Requested", version: 2,
      versions: [
        { version: 1, createdAt: "2 days ago", unitPrice: 65, totalPrice: 130000, leadTimeDays: 40, deliveryFee: 4200, notes: "Initial" },
        { version: 2, createdAt: "1 day ago", unitPrice: 60, totalPrice: 120000, leadTimeDays: 30, deliveryFee: 3800, notes: "Reduced unit price, faster lead time" },
      ],
      timeline: [
        { at: "2 days ago", actor: "buyer", label: "Buyer sent custom request" },
        { at: "2 days ago", actor: "supplier", label: "Supplier sent Custom Offer v1" },
        { at: "1 day ago", actor: "buyer", label: "Buyer requested changes (price)" },
        { at: "1 day ago", actor: "supplier", label: "Supplier sent revised Offer v2" },
      ],
    },
    {
      id: "off_003", requestId: "req_005", createdAt: "3 days ago",
      supplierId: "sup_003", buyerBusiness: "Hotel Antonio Group",
      productName: "Weekly vegetable & herb supply", category: "Vegetables", industry: "Agriculture & Fresh Produce",
      title: "Weekly produce basket — 5 hotel properties",
      description: "Mixed lettuce, tomato, onion, herbs. Chilled van, Mon & Thu delivery.",
      qty: 350, unit: "kg/week", unitPrice: 108.57, totalPrice: 38000,
      moq: 200, leadTimeDays: 1, deliveryFee: 0,
      deliverySchedule: "Mon & Thu 5-7 AM", deliveryLocation: "Makati + BGC",
      neededBy: "Ongoing",
      paymentTerms: "Weekly escrow release",
      escrowAvailable: true, validUntil: "14 days from send",
      stock: "Fresh harvest, GAP farms", warranty: "Replace wilted items on same delivery",
      certifications: "GAP-certified", notes: "3-month price lock.",
      attachments: [],
      breakdown: { product: 38000, delivery: 0, platform: 1140, vat: 4560, total: 43700 },
      recurring: { enabled: true, schedule: "Weekly (Mon & Thu)", duration: "3 months", priceLockMonths: 3 },
      status: "Converted to Order", version: 1,
      versions: [{ version: 1, createdAt: "3 days ago", unitPrice: 108.57, totalPrice: 38000, leadTimeDays: 1, deliveryFee: 0, notes: "Initial" }],
      timeline: [
        { at: "3 days ago", actor: "buyer", label: "Buyer sent custom request" },
        { at: "3 days ago", actor: "supplier", label: "Supplier sent Custom Offer v1" },
        { at: "2 days ago", actor: "buyer", label: "Buyer accepted offer" },
        { at: "2 days ago", actor: "system", label: "Order created & escrow funded" },
      ],
      orderId: "ord_d823001",
    },
  ];

  localStorage.setItem(REQS_KEY, JSON.stringify(reqs));
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
}
seed();

// ---------- CRUD ----------
export function getAllRequests(): CustomRequest[] {
  return read<CustomRequest[]>(REQS_KEY, []);
}
export function getRequest(id: string): CustomRequest | undefined {
  return getAllRequests().find((r) => r.id === id);
}
export function getAllOffers(): CustomOffer[] {
  return read<CustomOffer[]>(OFFERS_KEY, []);
}
export function getOffer(id: string): CustomOffer | undefined {
  return getAllOffers().find((o) => o.id === id);
}
export function getOffersForRequest(reqId: string): CustomOffer[] {
  return getAllOffers().filter((o) => o.requestId === reqId);
}

export function useAllRequests() {
  return useSyncExternalStore(subscribe, getAllRequests, () => [] as CustomRequest[]);
}
export function useRequest(id: string) {
  return useSyncExternalStore(subscribe, () => getRequest(id), () => undefined);
}
export function useAllOffers() {
  return useSyncExternalStore(subscribe, getAllOffers, () => [] as CustomOffer[]);
}
export function useOffer(id: string) {
  return useSyncExternalStore(subscribe, () => getOffer(id), () => undefined);
}

function newId(prefix: string) {
  return `${prefix}_${Math.floor(Date.now() / 1000) % 1000000}`;
}

export function createRequest(input: Omit<CustomRequest, "id" | "createdAt" | "status" | "offerIds">): CustomRequest {
  const req: CustomRequest = {
    ...input,
    id: newId("req"),
    createdAt: now(),
    status: "Waiting for Supplier Offer",
    offerIds: [],
  };
  const all = getAllRequests();
  all.unshift(req);
  write(REQS_KEY, all);
  return req;
}

export function updateRequest(id: string, patch: Partial<CustomRequest>) {
  const all = getAllRequests().map((r) => (r.id === id ? { ...r, ...patch } : r));
  write(REQS_KEY, all);
}

export function createOffer(
  requestId: string,
  input: Omit<CustomOffer, "id" | "requestId" | "createdAt" | "status" | "version" | "versions" | "timeline">
): CustomOffer {
  const req = getRequest(requestId);
  const offer: CustomOffer = {
    ...input,
    id: newId("off"),
    requestId,
    createdAt: now(),
    status: "Pending Review",
    version: 1,
    versions: [{
      version: 1, createdAt: now(),
      unitPrice: input.unitPrice, totalPrice: input.totalPrice,
      leadTimeDays: input.leadTimeDays, deliveryFee: input.deliveryFee,
      notes: "Initial offer",
    }],
    timeline: [
      ...(req ? [{ at: req.createdAt, actor: "buyer" as const, label: "Buyer sent custom request" }] : []),
      { at: now(), actor: "supplier", label: "Supplier sent Custom Offer v1" },
    ],
  };
  const all = getAllOffers();
  all.unshift(offer);
  write(OFFERS_KEY, all);
  if (req) updateRequest(requestId, { status: "Custom Offer Sent", offerIds: [...req.offerIds, offer.id] });
  return offer;
}

export function reviseOffer(id: string, patch: Partial<Pick<CustomOffer,
  "unitPrice" | "totalPrice" | "leadTimeDays" | "deliveryFee" | "notes" | "description" | "qty" | "deliverySchedule" | "paymentTerms" | "validUntil" | "breakdown"
>>) {
  const all = getAllOffers();
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return;
  const cur = all[idx];
  const nextVersion = cur.version + 1;
  const merged: CustomOffer = {
    ...cur, ...patch,
    version: nextVersion,
    status: "Pending Review",
    versions: [
      ...cur.versions,
      {
        version: nextVersion, createdAt: now(),
        unitPrice: patch.unitPrice ?? cur.unitPrice,
        totalPrice: patch.totalPrice ?? cur.totalPrice,
        leadTimeDays: patch.leadTimeDays ?? cur.leadTimeDays,
        deliveryFee: patch.deliveryFee ?? cur.deliveryFee,
        notes: patch.notes ?? "Revised offer",
      },
    ],
    timeline: [...cur.timeline, { at: now(), actor: "supplier", label: `Supplier sent revised Offer v${nextVersion}` }],
  };
  all[idx] = merged;
  write(OFFERS_KEY, all);
  updateRequest(cur.requestId, { status: "Custom Offer Sent" });
}

export function requestChanges(offerId: string, args: { fields: string[]; note: string }) {
  const all = getAllOffers();
  const idx = all.findIndex((o) => o.id === offerId);
  if (idx < 0) return;
  const cur = all[idx];
  all[idx] = {
    ...cur, status: "Changes Requested",
    timeline: [...cur.timeline, { at: now(), actor: "buyer", label: `Buyer requested changes (${args.fields.join(", ")}): ${args.note}` }],
  };
  write(OFFERS_KEY, all);
  updateRequest(cur.requestId, { status: "Buyer Requested Changes" });
}

export function rejectOffer(offerId: string, note?: string) {
  const all = getAllOffers();
  const idx = all.findIndex((o) => o.id === offerId);
  if (idx < 0) return;
  const cur = all[idx];
  all[idx] = {
    ...cur, status: "Rejected",
    timeline: [...cur.timeline, { at: now(), actor: "buyer", label: `Buyer rejected offer${note ? `: ${note}` : ""}` }],
  };
  write(OFFERS_KEY, all);
  updateRequest(cur.requestId, { status: "Rejected" });
}

// Accept offer → create escrow-protected DemoOrder, mark converted.
export function acceptOffer(offerId: string): DemoOrder | undefined {
  const all = getAllOffers();
  const idx = all.findIndex((o) => o.id === offerId);
  if (idx < 0) return;
  const cur = all[idx];

  // Use the supplier's first product so existing order-detail rendering keeps working.
  const firstP = products.find((p) => p.supplierId === cur.supplierId) ?? products[0];

  const order = escrowOrder({
    items: [{ productId: firstP.id, qty: cur.qty }],
    shippingDest: "Metro Manila",
    payment: cur.escrowAvailable ? "PSG Escrow (GCash)" : "Direct Bank Transfer",
    address: {
      business: cur.buyerBusiness,
      contact: "Purchasing Team",
      phone: "+63 917 000 0000",
      address: cur.deliveryLocation,
      instructions: `Custom offer ${cur.id} — ${cur.title}`,
    },
  });
  // Override amounts to match the offer breakdown so the order reflects the negotiated terms.
  order.subtotal = cur.totalPrice;
  order.shippingCost = cur.deliveryFee;
  order.totalPhp = cur.breakdown.total;
  order.supplierId = cur.supplierId;
  order.buyer = cur.buyerBusiness;
  saveDemoOrder(order);
  reserveStock(firstP.id, cur.qty, order.id);

  all[idx] = {
    ...cur, status: "Converted to Order", orderId: order.id,
    timeline: [
      ...cur.timeline,
      { at: now(), actor: "buyer", label: "Buyer accepted offer" },
      { at: now(), actor: "system", label: `Order ${order.id.toUpperCase()} created & escrow funded` },
    ],
  };
  write(OFFERS_KEY, all);
  updateRequest(cur.requestId, { status: "Converted to Order" });
  return order;
}

// ---------- Helpers ----------
export function offerStatusChip(s: OfferStatus): string {
  switch (s) {
    case "Pending Review": return "chip-primary";
    case "Accepted":
    case "Converted to Order": return "chip-verified";
    case "Changes Requested": return "chip-gold";
    case "Rejected":
    case "Expired": return "";
  }
}
export function requestStatusChip(s: RequestStatus): string {
  switch (s) {
    case "New Request":
    case "Waiting for Supplier Offer": return "chip-primary";
    case "Custom Offer Sent": return "chip-gold";
    case "Buyer Requested Changes": return "chip-gold";
    case "Accepted":
    case "Converted to Order": return "chip-verified";
    default: return "";
  }
}

export function computeBreakdown(unitPrice: number, qty: number, deliveryFee: number) {
  const product = Math.round(unitPrice * qty);
  const platform = Math.round(product * 0.03);
  const vat = Math.round((product + deliveryFee) * 0.12);
  const total = product + deliveryFee + platform + vat;
  return { product, delivery: deliveryFee, platform, vat, total };
}

export { suppliers, supplierById, formatPhp };
