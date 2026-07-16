// Simple localStorage-backed stores for buyer profile, business, preferences,
// and notifications. Falls back to demo values if empty.
import { useSyncExternalStore } from "react";

const EVT = "psg-buyer-store-change";
const isBrowser = typeof window !== "undefined";

const listeners = new Set<() => void>();
if (isBrowser) {
  window.addEventListener(EVT, () => listeners.forEach((l) => l()));
  window.addEventListener("storage", () => listeners.forEach((l) => l()));
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit() {
  if (isBrowser) window.dispatchEvent(new CustomEvent(EVT));
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(val));
  emit();
}

// ---------- Profile ----------
export type UserProfile = {
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  avatar: string;
  city: string;
  region: string;
};

const DEFAULT_PROFILE: UserProfile = {
  fullName: "Stefano San Gabriel",
  displayName: "Stefano",
  email: "stefano@lolanenas.ph",
  phone: "+63 917 555 0142",
  jobTitle: "Head of Procurement",
  avatar: "",
  city: "Quezon City",
  region: "NCR",
};

export const getProfile = () => read<UserProfile>("psg-user-profile", DEFAULT_PROFILE);
export const saveProfile = (p: UserProfile) => write("psg-user-profile", p);
export const useProfile = () =>
  useSyncExternalStore(subscribe, getProfile, () => DEFAULT_PROFILE);

// ---------- Business ----------
export type BusinessProfile = {
  businessName: string;
  businessType: string;
  industry: string;
  businessEmail: string;
  businessPhone: string;
  address: string;
  city: string;
  region: string;
  website: string;
  contactPerson: string;
  canIssueInvoice: "Yes" | "No" | "Depends";
  description: string;
};

const DEFAULT_BUSINESS: BusinessProfile = {
  businessName: "Lola Nena's Carinderia Group",
  businessType: "Restaurant Group",
  industry: "Food Service",
  businessEmail: "purchasing@lolanenas.ph",
  businessPhone: "+63 2 8555 0111",
  address: "12 Tomas Morato Ave.",
  city: "Quezon City",
  region: "NCR",
  website: "https://facebook.com/lolanenas",
  contactPerson: "Stefano San Gabriel",
  canIssueInvoice: "Yes",
  description: "Home-style Filipino carinderia group with 8 branches across Metro Manila.",
};

export const getBusiness = () => read<BusinessProfile>("psg-business-profile", DEFAULT_BUSINESS);
export const saveBusiness = (b: BusinessProfile) => write("psg-business-profile", b);
export const useBusiness = () =>
  useSyncExternalStore(subscribe, getBusiness, () => DEFAULT_BUSINESS);

// ---------- Buyer Preferences ----------
export type BuyerPreferences = {
  mainProducts: string;
  buyingFrequency: string;
  usualOrderSize: string;
  preferredSupplierLocations: string;
  preferredDeliveryMethods: string[];
  sourcingProblems: string;
};

const DEFAULT_PREFS: BuyerPreferences = {
  mainProducts: "Rice, cooking oil, packaging, coffee beans",
  buyingFrequency: "Weekly",
  usualOrderSize: "₱50,000 – ₱150,000",
  preferredSupplierLocations: "NCR, Bulacan, Cavite, Laguna",
  preferredDeliveryMethods: ["supplier_owned_logistics", "third_party_carrier"],
  sourcingProblems: "Unpredictable pricing, inconsistent supply of specialty items.",
};

export const getPreferences = () => read<BuyerPreferences>("psg-buyer-preferences", DEFAULT_PREFS);
export const savePreferences = (p: BuyerPreferences) => write("psg-buyer-preferences", p);
export const usePreferences = () =>
  useSyncExternalStore(subscribe, getPreferences, () => DEFAULT_PREFS);

// ---------- Notifications ----------
export type NotificationPrefs = {
  quoteUpdates: boolean;
  offerUpdates: boolean;
  orderUpdates: boolean;
  deliveryUpdates: boolean;
  paymentUpdates: boolean;
  messages: boolean;
  reorderReminders: boolean;
  verificationUpdates: boolean;
  securityAlerts: boolean;
};
const DEFAULT_NOTIFS: NotificationPrefs = {
  quoteUpdates: true,
  offerUpdates: true,
  orderUpdates: true,
  deliveryUpdates: true,
  paymentUpdates: true,
  messages: true,
  reorderReminders: true,
  verificationUpdates: true,
  securityAlerts: true,
};
export const getNotifs = () => read<NotificationPrefs>("psg-notification-preferences", DEFAULT_NOTIFS);
export const saveNotifs = (n: NotificationPrefs) => write("psg-notification-preferences", n);
export const useNotifs = () =>
  useSyncExternalStore(subscribe, getNotifs, () => DEFAULT_NOTIFS);
