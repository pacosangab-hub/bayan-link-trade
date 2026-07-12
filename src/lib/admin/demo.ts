// Admin Console demo data + admin notes + audit logs.
// All localStorage-backed. Safe for SSR (guards typeof window).
import { useSyncExternalStore } from "react";

const isBrowser = typeof window !== "undefined";

// ---------------- Admin Notes ----------------
export type AdminNote = {
  id: string;
  relatedType: "buyer" | "supplier" | "order" | "dispute" | "payment" | "listing";
  relatedId: string;
  note: string;
  createdBy: string;
  createdAt: string;
};

// ---------------- Audit Logs ----------------
export type AuditLog = {
  id: string;
  adminUser: string;
  action: string;
  entityType: string;
  entityId: string;
  previousStatus?: string;
  newStatus?: string;
  timestamp: string;
};

const NOTES_KEY = "psg_admin_notes_v1";
const AUDIT_KEY = "psg_admin_audit_v1";

const listeners = new Set<() => void>();
if (isBrowser) {
  window.addEventListener("psg-admin-change", () => listeners.forEach((l) => l()));
}
function emit() {
  if (isBrowser) window.dispatchEvent(new CustomEvent("psg-admin-change"));
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJSON<T>(key: string, value: T) {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

const EMPTY_NOTES: AdminNote[] = [];
const EMPTY_AUDIT: AuditLog[] = [];

export function useAdminNotes(relatedType?: string, relatedId?: string): AdminNote[] {
  const all = useSyncExternalStore(
    subscribe,
    () => readJSON<AdminNote[]>(NOTES_KEY, EMPTY_NOTES),
    () => EMPTY_NOTES,
  );
  if (!relatedType) return all;
  return all.filter(
    (n) => n.relatedType === relatedType && (!relatedId || n.relatedId === relatedId),
  );
}
export function addAdminNote(n: Omit<AdminNote, "id" | "createdAt" | "createdBy">) {
  const all = readJSON<AdminNote[]>(NOTES_KEY, []);
  all.unshift({
    ...n,
    id: `note_${Date.now()}`,
    createdBy: "Admin",
    createdAt: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
  });
  writeJSON(NOTES_KEY, all);
  addAudit({
    action: "admin note added",
    entityType: n.relatedType,
    entityId: n.relatedId,
    newStatus: n.note.slice(0, 60),
  });
}

export function useAuditLogs(entityType?: string, entityId?: string): AuditLog[] {
  const all = useSyncExternalStore(
    subscribe,
    () => readJSON<AuditLog[]>(AUDIT_KEY, EMPTY_AUDIT),
    () => EMPTY_AUDIT,
  );
  if (!entityType) return all;
  return all.filter((a) => a.entityType === entityType && (!entityId || a.entityId === entityId));
}
export function addAudit(a: Omit<AuditLog, "id" | "timestamp" | "adminUser">) {
  const all = readJSON<AuditLog[]>(AUDIT_KEY, []);
  all.unshift({
    ...a,
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    adminUser: "Admin",
    timestamp: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
  });
  writeJSON(AUDIT_KEY, all.slice(0, 500));
}

// ---------------- Demo Buyers ----------------
export type DemoBuyer = {
  id: string;
  business: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  industry: string;
  requests: number;
  orders: number;
  spend: number;
  lastActive: string;
  status: "Active" | "New" | "Inactive" | "Flagged" | "Suspended";
  categories: string[];
  disputes: number;
};

export const DEMO_BUYERS: DemoBuyer[] = [
  { id: "buy_1", business: "Hotel Antonio Group", contact: "Maria Santos", email: "procurement@hotelantonio.ph", phone: "+63 917 100 2233", location: "Makati", industry: "Hospitality", requests: 12, orders: 8, spend: 342000, lastActive: "2h ago", status: "Active", categories: ["Food", "Cleaning", "Linen"], disputes: 0 },
  { id: "buy_2", business: "SM Retail Foods", contact: "Ramon dela Cruz", email: "buyer@smretail.ph", phone: "+63 917 555 8811", location: "Pasay", industry: "Retail", requests: 34, orders: 22, spend: 1240000, lastActive: "1h ago", status: "Active", categories: ["Rice", "Seafood", "Poultry"], disputes: 1 },
  { id: "buy_3", business: "Jollibee Central Kitchen", contact: "Angel Reyes", email: "supply@jollibee.ph", phone: "+63 917 200 3344", location: "Pasig", industry: "Food Service", requests: 47, orders: 30, spend: 2450000, lastActive: "20m ago", status: "Active", categories: ["Chicken", "Oil", "Packaging"], disputes: 0 },
  { id: "buy_4", business: "Manila Bay Restaurants", contact: "Jose Alvarez", email: "orders@manilabay.ph", phone: "+63 917 300 4455", location: "Manila", industry: "Restaurant", requests: 8, orders: 4, spend: 120000, lastActive: "1d ago", status: "New", categories: ["Seafood", "Produce"], disputes: 0 },
  { id: "buy_5", business: "Cebu Grand Hotel", contact: "Lucia Ramos", email: "procurement@cebugrand.ph", phone: "+63 917 400 5566", location: "Cebu", industry: "Hospitality", requests: 15, orders: 11, spend: 560000, lastActive: "3d ago", status: "Active", categories: ["Linen", "Amenities"], disputes: 0 },
  { id: "buy_6", business: "Palawan Beach Resort", contact: "Ferdie Lim", email: "supply@palawanbeach.ph", phone: "+63 917 500 6677", location: "Palawan", industry: "Hospitality", requests: 6, orders: 2, spend: 78000, lastActive: "1w ago", status: "Inactive", categories: ["Amenities", "Food"], disputes: 0 },
  { id: "buy_7", business: "Metro Pharma Distributors", contact: "Dr. Isabel Cruz", email: "purchasing@metropharma.ph", phone: "+63 917 600 7788", location: "Quezon City", industry: "Pharmaceutical", requests: 22, orders: 14, spend: 890000, lastActive: "5h ago", status: "Flagged", categories: ["Pharma", "Medical"], disputes: 2 },
  { id: "buy_8", business: "Ayala Malls Concessionaires", contact: "Peter Tan", email: "buyer@ayala.ph", phone: "+63 917 700 8899", location: "Makati", industry: "Retail", requests: 18, orders: 12, spend: 620000, lastActive: "8h ago", status: "Active", categories: ["Food", "Packaging"], disputes: 0 },
];

// ---------------- Demo Suppliers ----------------
export type DemoSupplier = {
  id: string;
  supplier: string;
  type: "Manufacturer" | "Trader" | "Cooperative" | "Distributor" | "Farm";
  location: string;
  verification: "Unverified" | "Claimed" | "Business Verified" | "Product Docs Verified" | "Gold Supplier" | "Escrow Ready";
  listings: number;
  responses: number;
  orders: number;
  sales: number;
  rating: number;
  responseTime: string;
  disputeRate: number;
  status: "Active" | "Pending Verification" | "Needs Documents" | "Flagged" | "Suspended";
};

export const DEMO_SUPPLIERS: DemoSupplier[] = [
  { id: "sup_1", supplier: "Bulacan Grain & Rice Mills Inc.", type: "Manufacturer", location: "Malolos, Bulacan", verification: "Gold Supplier", listings: 18, responses: 42, orders: 26, sales: 1240000, rating: 4.8, responseTime: "1.2 hrs", disputeRate: 0.4, status: "Active" },
  { id: "sup_2", supplier: "Pampanga Fresh Catch Coop", type: "Cooperative", location: "San Fernando", verification: "Business Verified", listings: 12, responses: 28, orders: 14, sales: 620000, rating: 4.5, responseTime: "3.1 hrs", disputeRate: 1.2, status: "Active" },
  { id: "sup_3", supplier: "Batangas Farm Poultry Corp.", type: "Farm", location: "Lipa", verification: "Escrow Ready", listings: 22, responses: 55, orders: 34, sales: 1820000, rating: 4.7, responseTime: "1.8 hrs", disputeRate: 0.6, status: "Active" },
  { id: "sup_4", supplier: "North Luzon Chemical Traders", type: "Trader", location: "Valenzuela", verification: "Claimed", listings: 6, responses: 5, orders: 1, sales: 45000, rating: 4.0, responseTime: "12 hrs", disputeRate: 0, status: "Pending Verification" },
  { id: "sup_5", supplier: "Bicol Seafood Export Coop", type: "Cooperative", location: "Legazpi", verification: "Claimed", listings: 8, responses: 12, orders: 3, sales: 156000, rating: 4.2, responseTime: "6 hrs", disputeRate: 0, status: "Needs Documents" },
  { id: "sup_6", supplier: "Davao Cement & Hardware Corp.", type: "Distributor", location: "Davao", verification: "Business Verified", listings: 30, responses: 18, orders: 9, sales: 480000, rating: 3.4, responseTime: "8 hrs", disputeRate: 4.5, status: "Flagged" },
  { id: "sup_7", supplier: "Iloilo Sugar & Coco Traders", type: "Trader", location: "Iloilo", verification: "Business Verified", listings: 14, responses: 30, orders: 18, sales: 720000, rating: 4.6, responseTime: "2.4 hrs", disputeRate: 0.5, status: "Active" },
  { id: "sup_8", supplier: "Cavite Packaging Solutions", type: "Manufacturer", location: "Bacoor", verification: "Product Docs Verified", listings: 24, responses: 40, orders: 22, sales: 950000, rating: 4.7, responseTime: "1.5 hrs", disputeRate: 0.3, status: "Active" },
];

// ---------------- Demo Listings ----------------
export type DemoListing = {
  id: string;
  product: string;
  supplier: string;
  category: string;
  price: string;
  stock: "In Stock" | "Low Stock" | "Out of Stock" | "Made to Order";
  compliance: "Standard" | "Restricted" | "Docs Required";
  status: "Pending Review" | "Active" | "Needs Changes" | "Restricted" | "Rejected";
  submitted: string;
};

export const DEMO_LISTINGS: DemoListing[] = [
  { id: "lst_1", product: "Premium Jasmine Rice 50kg", supplier: "Bulacan Grain & Rice Mills Inc.", category: "Rice & Grains", price: "₱2,450 / sack", stock: "In Stock", compliance: "Standard", status: "Active", submitted: "5d ago" },
  { id: "lst_2", product: "Fresh Bangus Whole 20kg", supplier: "Pampanga Fresh Catch Coop", category: "Seafood", price: "₱4,200 / box", stock: "Low Stock", compliance: "Standard", status: "Active", submitted: "3d ago" },
  { id: "lst_3", product: "Free-range Chicken 10kg", supplier: "Batangas Farm Poultry Corp.", category: "Poultry", price: "₱3,800 / crate", stock: "In Stock", compliance: "Standard", status: "Active", submitted: "1w ago" },
  { id: "lst_4", product: "Industrial Sodium Hydroxide 25kg", supplier: "North Luzon Chemical Traders", category: "Chemicals & Raw Materials", price: "₱1,850 / bag", stock: "Made to Order", compliance: "Restricted", status: "Pending Review", submitted: "1d ago" },
  { id: "lst_5", product: "Frozen Tuna Loin Export Grade", supplier: "Bicol Seafood Export Coop", category: "Seafood", price: "₱620 / kg", stock: "In Stock", compliance: "Docs Required", status: "Pending Review", submitted: "2d ago" },
  { id: "lst_6", product: "Portland Cement 40kg (Type I)", supplier: "Davao Cement & Hardware Corp.", category: "Construction", price: "₱285 / bag", stock: "In Stock", compliance: "Standard", status: "Needs Changes", submitted: "4d ago" },
  { id: "lst_7", product: "Refined Sugar White 50kg", supplier: "Iloilo Sugar & Coco Traders", category: "Food Manufacturing", price: "₱3,200 / sack", stock: "In Stock", compliance: "Standard", status: "Active", submitted: "6d ago" },
  { id: "lst_8", product: "Corrugated Boxes 12x12x12", supplier: "Cavite Packaging Solutions", category: "Packaging", price: "₱18 / pc", stock: "In Stock", compliance: "Standard", status: "Active", submitted: "1w ago" },
  { id: "lst_9", product: "Paracetamol 500mg Blister x100", supplier: "North Luzon Chemical Traders", category: "Pharmaceutical & Health", price: "Quote only", stock: "Made to Order", compliance: "Restricted", status: "Pending Review", submitted: "12h ago" },
  { id: "lst_10", product: "Organic Coconut Oil 20L", supplier: "Iloilo Sugar & Coco Traders", category: "Food Manufacturing", price: "₱2,850 / drum", stock: "Low Stock", compliance: "Standard", status: "Pending Review", submitted: "8h ago" },
  { id: "lst_11", product: "Chlorhexidine Solution 5L", supplier: "North Luzon Chemical Traders", category: "Medical Supplies", price: "Quote only", stock: "Made to Order", compliance: "Restricted", status: "Restricted", submitted: "10d ago" },
  { id: "lst_12", product: "Uncertified Fish Balls 10kg", supplier: "Pampanga Fresh Catch Coop", category: "Food Manufacturing", price: "₱450 / pack", stock: "Out of Stock", compliance: "Docs Required", status: "Rejected", submitted: "2w ago" },
];

// ---------------- Demo Quote Requests ----------------
export type DemoRequest = {
  id: string;
  buyer: string;
  product: string;
  category: string;
  qty: string;
  location: string;
  contacted: number;
  offers: number;
  status: "Open" | "Sent to Suppliers" | "Offers Received" | "Buyer Reviewing" | "Converted to Order" | "Expired" | "Cancelled";
  created: string;
};

export const DEMO_REQUESTS: DemoRequest[] = [
  { id: "REQ-1042", buyer: "Hotel Antonio Group", product: "Bath towels bulk", category: "Linen", qty: "500 pcs", location: "Makati", contacted: 6, offers: 3, status: "Offers Received", created: "2h ago" },
  { id: "REQ-1041", buyer: "Jollibee Central Kitchen", product: "Whole chicken 1.2kg", category: "Poultry", qty: "800 crates/mo", location: "Pasig", contacted: 4, offers: 4, status: "Buyer Reviewing", created: "6h ago" },
  { id: "REQ-1040", buyer: "SM Retail Foods", product: "Jasmine rice 50kg", category: "Rice & Grains", qty: "300 sacks", location: "Pasay", contacted: 8, offers: 5, status: "Converted to Order", created: "1d ago" },
  { id: "REQ-1039", buyer: "Metro Pharma Distributors", product: "Paracetamol 500mg", category: "Pharmaceutical & Health", qty: "10,000 bottles", location: "QC", contacted: 3, offers: 1, status: "Sent to Suppliers", created: "1d ago" },
  { id: "REQ-1038", buyer: "Manila Bay Restaurants", product: "Fresh bangus whole", category: "Seafood", qty: "50 boxes", location: "Manila", contacted: 5, offers: 0, status: "Open", created: "2d ago" },
  { id: "REQ-1037", buyer: "Cebu Grand Hotel", product: "Commercial detergent 20L", category: "Cleaning", qty: "40 drums", location: "Cebu", contacted: 6, offers: 3, status: "Offers Received", created: "3d ago" },
  { id: "REQ-1036", buyer: "Ayala Malls Concessionaires", product: "Corrugated boxes", category: "Packaging", qty: "20,000 pcs", location: "Makati", contacted: 5, offers: 2, status: "Buyer Reviewing", created: "4d ago" },
  { id: "REQ-1035", buyer: "Palawan Beach Resort", product: "Guest amenities kits", category: "Amenities", qty: "1,000 kits", location: "Palawan", contacted: 4, offers: 0, status: "Expired", created: "10d ago" },
];

// ---------------- Demo Orders ----------------
export type DemoOrder = {
  id: string;
  buyer: string;
  supplier: string;
  product: string;
  amount: number;
  payment: "Awaiting Payment" | "Paid" | "Failed" | "Refunded" | "Cancelled";
  status: "Awaiting Payment" | "Payment Protected" | "Preparing Shipment" | "In Transit" | "Delivered" | "Completed" | "Disputed" | "Cancelled";
  escrow: "Awaiting Payment" | "Funded" | "Held" | "Release Pending" | "Released" | "Disputed" | "Refunded";
  date: string;
};

export const DEMO_ORDERS: DemoOrder[] = [
  { id: "PSG-30411", buyer: "SM Retail Foods", supplier: "Bulacan Grain & Rice Mills Inc.", product: "Jasmine rice 50kg × 300", amount: 735000, payment: "Paid", status: "In Transit", escrow: "Held", date: "Today" },
  { id: "PSG-30410", buyer: "Jollibee Central Kitchen", supplier: "Batangas Farm Poultry Corp.", product: "Chicken 1.2kg × 800", amount: 3040000, payment: "Paid", status: "Preparing Shipment", escrow: "Held", date: "Today" },
  { id: "PSG-30409", buyer: "Hotel Antonio Group", supplier: "Cavite Packaging Solutions", product: "Bath towels × 500", amount: 92500, payment: "Paid", status: "Delivered", escrow: "Release Pending", date: "Yesterday" },
  { id: "PSG-30408", buyer: "Ayala Malls Concessionaires", supplier: "Cavite Packaging Solutions", product: "Corrugated boxes × 20,000", amount: 360000, payment: "Paid", status: "Completed", escrow: "Released", date: "2d ago" },
  { id: "PSG-30407", buyer: "Metro Pharma Distributors", supplier: "North Luzon Chemical Traders", product: "Sodium hydroxide × 200", amount: 370000, payment: "Paid", status: "Disputed", escrow: "Disputed", date: "3d ago" },
  { id: "PSG-30406", buyer: "Cebu Grand Hotel", supplier: "Iloilo Sugar & Coco Traders", product: "Refined sugar × 100", amount: 320000, payment: "Paid", status: "Delivered", escrow: "Release Pending", date: "4d ago" },
  { id: "PSG-30405", buyer: "Manila Bay Restaurants", supplier: "Pampanga Fresh Catch Coop", product: "Bangus × 30", amount: 126000, payment: "Awaiting Payment", status: "Awaiting Payment", escrow: "Awaiting Payment", date: "5d ago" },
  { id: "PSG-30404", buyer: "SM Retail Foods", supplier: "Bulacan Grain & Rice Mills Inc.", product: "Rice × 150", amount: 367500, payment: "Paid", status: "Completed", escrow: "Released", date: "1w ago" },
];

// ---------------- Demo Payments ----------------
export type DemoPayment = {
  id: string;
  orderId: string;
  buyer: string;
  supplier: string;
  amount: number;
  fee: number;
  payout: number;
  paymentStatus: "Awaiting Payment" | "Paid" | "Failed" | "Refunded" | "Cancelled";
  escrow: "Awaiting Payment" | "Funded" | "Held" | "Release Pending" | "Released" | "Disputed" | "Refunded";
  payoutStatus: "Not Ready" | "Pending Release" | "Processing" | "Released" | "Blocked" | "Failed";
  disputed?: boolean;
  buyerConfirmed?: boolean;
  supplierVerified?: boolean;
};

export const DEMO_PAYMENTS: DemoPayment[] = DEMO_ORDERS.map((o) => {
  const fee = Math.round(o.amount * 0.065);
  const payout = o.amount - fee;
  const escrow = o.escrow;
  let payoutStatus: DemoPayment["payoutStatus"] = "Not Ready";
  if (escrow === "Released") payoutStatus = "Released";
  else if (escrow === "Release Pending") payoutStatus = "Pending Release";
  else if (escrow === "Disputed") payoutStatus = "Blocked";
  else if (escrow === "Held") payoutStatus = "Not Ready";
  return {
    id: `PAY-${o.id.split("-")[1]}`,
    orderId: o.id,
    buyer: o.buyer,
    supplier: o.supplier,
    amount: o.amount,
    fee,
    payout,
    paymentStatus: o.payment,
    escrow: o.escrow,
    payoutStatus,
    disputed: o.status === "Disputed",
    buyerConfirmed: o.status === "Delivered" || o.status === "Completed",
    supplierVerified: !["North Luzon Chemical Traders"].includes(o.supplier),
  };
});

// ---------------- Demo Disputes ----------------
export type DemoDispute = {
  id: string;
  orderId: string;
  buyer: string;
  supplier: string;
  reason: string;
  amount: number;
  status: "Open" | "Awaiting Supplier Response" | "Under Review" | "Resolved Refund" | "Resolved Release" | "Partial Refund" | "Closed";
  opened: string;
  buyerClaim: string;
  supplierResponse?: string;
};

export const DEMO_DISPUTES: DemoDispute[] = [
  { id: "DSP-201", orderId: "PSG-30407", buyer: "Metro Pharma Distributors", supplier: "North Luzon Chemical Traders", reason: "Wrong product delivered", amount: 370000, status: "Under Review", opened: "3d ago", buyerClaim: "Received sodium bicarbonate instead of sodium hydroxide. Batch numbers do not match invoice.", supplierResponse: "Verifying with warehouse team. Will provide dispatch documents." },
  { id: "DSP-200", orderId: "PSG-30398", buyer: "Cebu Grand Hotel", supplier: "Davao Cement & Hardware Corp.", reason: "Late delivery + damaged goods", amount: 145000, status: "Awaiting Supplier Response", opened: "5d ago", buyerClaim: "40% of towels arrived stained. Delivered 8 days late." },
  { id: "DSP-199", orderId: "PSG-30390", buyer: "Manila Bay Restaurants", supplier: "Pampanga Fresh Catch Coop", reason: "Short quantity", amount: 84000, status: "Open", opened: "6d ago", buyerClaim: "Ordered 30 boxes, received 24. Missing 6 boxes of bangus." },
];

// ---------------- Demo Verification Queue ----------------
export type DemoVerification = {
  id: string;
  supplier: string;
  docsSubmitted: string[];
  businessType: string;
  location: string;
  status: "Unverified" | "Claimed" | "Business Verified" | "Product Docs Verified" | "Gold Supplier" | "Escrow Ready" | "Rejected";
  submitted: string;
};

export const DEMO_VERIFICATIONS: DemoVerification[] = [
  { id: "ver_1", supplier: "North Luzon Chemical Traders", docsSubmitted: ["DTI", "BIR", "Mayor's Permit"], businessType: "Trader", location: "Valenzuela", status: "Claimed", submitted: "1d ago" },
  { id: "ver_2", supplier: "Bicol Seafood Export Coop", docsSubmitted: ["DTI", "BIR"], businessType: "Cooperative", location: "Legazpi", status: "Claimed", submitted: "2d ago" },
  { id: "ver_3", supplier: "Cagayan Valley Corn Farmers", docsSubmitted: ["DTI", "BIR", "Mayor's Permit", "Bank Proof"], businessType: "Farm", location: "Isabela", status: "Business Verified", submitted: "3d ago" },
  { id: "ver_4", supplier: "Zamboanga Sardines Corp.", docsSubmitted: ["DTI", "BIR", "FDA", "Mayor's Permit"], businessType: "Manufacturer", location: "Zamboanga", status: "Product Docs Verified", submitted: "4d ago" },
  { id: "ver_5", supplier: "Baguio Vegetable Growers Assn.", docsSubmitted: ["DTI"], businessType: "Cooperative", location: "Baguio", status: "Claimed", submitted: "5d ago" },
  { id: "ver_6", supplier: "Tarlac Poultry Farms Corp.", docsSubmitted: ["DTI", "BIR", "Mayor's Permit"], businessType: "Farm", location: "Tarlac", status: "Business Verified", submitted: "1w ago" },
  { id: "ver_7", supplier: "GenSan Tuna Exporters Coop", docsSubmitted: ["DTI", "BIR", "FDA", "Mayor's Permit", "Bank Proof"], businessType: "Cooperative", location: "General Santos", status: "Product Docs Verified", submitted: "1w ago" },
  { id: "ver_8", supplier: "Batangas Cacao Farmers Coop", docsSubmitted: ["DTI"], businessType: "Cooperative", location: "Batangas", status: "Claimed", submitted: "2w ago" },
];

// ---------------- Marketplace Snapshot ----------------
export const MARKETPLACE_SNAPSHOT = {
  buyers: 248,
  suppliers: 68,
  activeListings: 219,
  quoteRequests: 42,
  openOrders: 18,
  gmv: 1420000,
  fees: 92300,
  disputes: 3,
};

export const MARKETPLACE_HEALTH = {
  quoteResponseRate: 74,
  offerAcceptanceRate: 31,
  orderCompletionRate: 89,
  disputeRate: 1.8,
  avgResponseTime: "2.4 hrs",
  buyerSupplierRatio: "3.6 : 1",
};

// ---------------- Recent Activity ----------------
export const RECENT_ACTIVITY = [
  { icon: "request", text: "Hotel Antonio Group posted quote request for 500 bath towels", when: "2m ago" },
  { icon: "offer", text: "Bulacan Grain & Rice Mills sent offer to SM Retail Foods", when: "18m ago" },
  { icon: "accept", text: "Jollibee accepted offer from Batangas Farm Poultry", when: "42m ago" },
  { icon: "order", text: "Order PSG-30411 created — ₱735,000", when: "1h ago" },
  { icon: "escrow", text: "Payment PAY-30411 protected in escrow", when: "1h ago" },
  { icon: "proof", text: "Cavite Packaging uploaded proof of delivery for PSG-30409", when: "3h ago" },
  { icon: "confirm", text: "Hotel Antonio confirmed delivery for PSG-30409", when: "3h ago" },
  { icon: "dispute", text: "Dispute DSP-201 opened for PSG-30407", when: "5h ago" },
  { icon: "verify", text: "Zamboanga Sardines Corp. — product docs verified", when: "8h ago" },
  { icon: "listing", text: "Listing 'Portland Cement 40kg' approved", when: "1d ago" },
];

// ---------------- Safety Feed ----------------
export type SafetyItem = {
  id: string;
  type: "Reported Message" | "Flagged Supplier" | "Restricted Product" | "Off-platform Warning" | "Suspicious Activity";
  user: string;
  issue: string;
  related: string;
  risk: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Reviewed" | "Actioned" | "Dismissed";
};

export const DEMO_SAFETY: SafetyItem[] = [
  { id: "sf_1", type: "Off-platform Warning", user: "Pampanga Fresh Catch Coop", issue: "Message contained 'pay direct via GCash'", related: "Msg #4821", risk: "High", status: "Open" },
  { id: "sf_2", type: "Restricted Product", user: "North Luzon Chemical Traders", issue: "Sodium hydroxide listing needs FDA docs", related: "lst_4", risk: "Medium", status: "Open" },
  { id: "sf_3", type: "Reported Message", user: "Davao Cement & Hardware Corp.", issue: "Buyer reported harassment", related: "Msg #4750", risk: "Medium", status: "Reviewed" },
  { id: "sf_4", type: "Flagged Supplier", user: "Davao Cement & Hardware Corp.", issue: "4.5% dispute rate — above 3% threshold", related: "sup_6", risk: "High", status: "Open" },
  { id: "sf_5", type: "Suspicious Activity", user: "Metro Pharma Distributors", issue: "Multiple large orders in 24h", related: "PSG-30407, PSG-30402", risk: "Low", status: "Dismissed" },
  { id: "sf_6", type: "Off-platform Warning", user: "buyer_022", issue: "'bank transfer outside PSG' detected", related: "Msg #4802", risk: "Critical", status: "Open" },
];

export const OFF_PLATFORM_KEYWORDS = [
  "pay direct", "bank transfer outside PSG", "GCash direct", "Maya direct",
  "send deposit", "outside platform", "personal account", "bypass fee",
];

export function peso(n: number) {
  return "₱" + n.toLocaleString("en-PH");
}
