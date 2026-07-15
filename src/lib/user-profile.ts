// Per-user profile, business, preferences, and notification prefs stored in
// localStorage. Backend-agnostic — swap for Supabase later without changing
// the component API.
import { useSyncExternalStore } from "react";

const KEYS = {
  profile: "psg-user-profile",
  business: "psg-business-profile",
  accountType: "psg-account-type",
  buyerPrefs: "psg-buyer-preferences",
  supplierPrefs: "psg-supplier-profile",
  notifications: "psg-notification-preferences",
  security: "psg-security-settings",
  defaultPortal: "psg-default-portal",
};

const EVT = "psg-profile-change";
const isBrowser = typeof window !== "undefined";

function read<T>(k: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write<T>(k: string, v: T) {
  if (!isBrowser) return;
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(EVT));
}

export interface PersonalProfile {
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  avatarUrl?: string;
  city: string;
  region: string;
}

export interface BusinessProfile {
  businessName: string;
  businessType: string;
  industry: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  website: string;
  contactPerson: string;
  taxId: string;
  canIssueInvoice: "Yes" | "No" | "Depends";
  description: string;
}

export type AccountType = "buyer" | "supplier" | "both" | "admin";

export interface BuyerPreferences {
  products: string[];
  frequency: string;
  orderSize: string;
  regions: string[];
  deliveryMethods: string[];
  problems: string;
}

export interface SupplierPrefs {
  supplierType: string;
  categories: string[];
  serviceAreas: string[];
  minOrder: string;
  deliveryCapability: string[];
  protectedPayments: boolean;
  canIssueInvoice: boolean;
}

export interface NotificationPrefs {
  quotes: boolean;
  offers: boolean;
  orders: boolean;
  deliveries: boolean;
  payments: boolean;
  messages: boolean;
  reorders: boolean;
  verification: boolean;
  security: boolean;
  admin: boolean;
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  quotes: true, offers: true, orders: true, deliveries: true, payments: true,
  messages: true, reorders: true, verification: true, security: true, admin: true,
};

export const BUSINESS_TYPES = [
  "Restaurant / Carinderia", "Café / Milk Tea / Beverage Shop", "Sari-sari Store",
  "Grocery / Mini Mart", "Hotel / Hospitality", "Commissary / Cloud Kitchen",
  "Food Brand", "Manufacturer", "Distributor", "Wholesaler", "Farmer / Co-op",
  "Packaging Supplier", "Logistics Provider", "Other",
];

export const INDUSTRIES = [
  "Food & Beverage", "Packaging", "FMCG", "Restaurant Supplies",
  "Hotel & Hospitality", "Agriculture", "Logistics", "Manufacturing",
  "Wholesale / Distribution", "Retail", "Other",
];

export const BUYER_PRODUCT_CHIPS = [
  "Rice & Grains", "Meat & Frozen Food", "Coffee & Café Supplies", "Packaging",
  "Cleaning Supplies", "Beverages", "Condiments & Sauces", "Bakery Ingredients",
  "Fresh Produce", "Eggs & Dairy", "Hotel Supplies", "Office Supplies",
];

export const BUYING_FREQUENCY = ["Daily", "Weekly", "Every 2 weeks", "Monthly", "As needed"];
export const ORDER_SIZE = ["Under ₱5,000", "₱5,000–₱25,000", "₱25,000–₱100,000", "₱100,000+"];
export const PREFERRED_DELIVERY = ["Pick Up at Warehouse", "Third-Party Carrier with Tracking", "Supplier-Owned Logistics"];

export const SUPPLIER_TYPES = ["Manufacturer", "Distributor", "Wholesaler", "Farmer / Co-op", "Importer", "Packaging Supplier", "Logistics Provider", "Service Provider"];
export const SUPPLIER_CATEGORIES = [
  "Food & FMCG", "Agriculture & Fresh Produce", "Packaging", "Coffee & Café Supplies",
  "Cleaning & Hygiene", "Beverages", "Construction Materials", "Hotel & Restaurant Supplies",
  "Pharma & Health", "Personal Care & Cosmetics", "Office Supplies", "Logistics",
];

export function getProfile(): PersonalProfile {
  return read(KEYS.profile, {
    fullName: "Stefano San Gabriel", displayName: "Stef", email: "stefano@example.com",
    phone: "+63 917 000 0000", jobTitle: "Head of Procurement",
    city: "Quezon City", region: "NCR",
  });
}
export const setProfile = (p: PersonalProfile) => write(KEYS.profile, p);

export function getBusiness(): BusinessProfile {
  return read(KEYS.business, {
    businessName: "Lola Nena's Carinderia Group", businessType: "Restaurant / Carinderia",
    industry: "Food & Beverage", email: "orders@lolanenas.ph", phone: "+63 917 123 4567",
    address: "Project 8 Commissary", city: "Quezon City", region: "NCR",
    website: "facebook.com/lolanenas", contactPerson: "Stefano San Gabriel",
    taxId: "", canIssueInvoice: "Yes", description: "Multi-branch carinderia group in Metro Manila.",
  });
}
export const setBusiness = (b: BusinessProfile) => write(KEYS.business, b);

export function getAccountType(fallback: AccountType = "buyer"): AccountType {
  return read(KEYS.accountType, fallback);
}
export const setAccountType = (t: AccountType) => write(KEYS.accountType, t);

export function getDefaultPortal(): "buyer" | "supplier" {
  return read(KEYS.defaultPortal, "buyer");
}
export const setDefaultPortal = (p: "buyer" | "supplier") => write(KEYS.defaultPortal, p);

export function getBuyerPrefs(): BuyerPreferences {
  return read(KEYS.buyerPrefs, {
    products: ["Rice & Grains", "Coffee & Café Supplies"], frequency: "Weekly",
    orderSize: "₱25,000–₱100,000", regions: ["NCR"],
    deliveryMethods: ["Supplier-Owned Logistics"], problems: "",
  });
}
export const setBuyerPrefs = (p: BuyerPreferences) => write(KEYS.buyerPrefs, p);

export function getSupplierPrefs(): SupplierPrefs {
  return read(KEYS.supplierPrefs, {
    supplierType: "Manufacturer", categories: ["Food & FMCG"], serviceAreas: ["NCR"],
    minOrder: "₱5,000", deliveryCapability: ["Supplier-Owned Logistics"],
    protectedPayments: true, canIssueInvoice: true,
  });
}
export const setSupplierPrefs = (p: SupplierPrefs) => write(KEYS.supplierPrefs, p);

export function getNotifications(): NotificationPrefs {
  return { ...DEFAULT_NOTIFICATIONS, ...read(KEYS.notifications, {} as Partial<NotificationPrefs>) };
}
export const setNotifications = (n: NotificationPrefs) => write(KEYS.notifications, n);

function subscribe(cb: () => void) {
  if (!isBrowser) return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", h);
  return () => { window.removeEventListener(EVT, h); window.removeEventListener("storage", h); };
}

export function useProfile() {
  return useSyncExternalStore(subscribe, getProfile, getProfile);
}
export function useBusiness() {
  return useSyncExternalStore(subscribe, getBusiness, getBusiness);
}
export function useAccountType(fallback: AccountType = "buyer") {
  return useSyncExternalStore(subscribe, () => getAccountType(fallback), () => fallback);
}
export function useDefaultPortal() {
  return useSyncExternalStore(subscribe, getDefaultPortal, () => "buyer" as const);
}
export function useNotifications() {
  return useSyncExternalStore(subscribe, getNotifications, () => DEFAULT_NOTIFICATIONS);
}
