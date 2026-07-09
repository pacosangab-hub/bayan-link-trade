// Safety reports store — for /admin/safety and Report buttons.
import { useSyncExternalStore } from "react";

export type Report = {
  id: string;
  createdAt: string;
  reason: string;
  note: string;
  targetType: "conversation" | "supplier" | "order" | "message";
  targetId: string;
  targetLabel: string;
  status: "Open" | "Dismissed" | "Actioned";
};

const KEY = "psg_safety_reports_v1";
const isBrowser = typeof window !== "undefined";
const listeners = new Set<() => void>();
const EMPTY_REPORTS: Report[] = [];
let cache: { raw: string; value: Report[] } | undefined;

if (isBrowser) {
  window.addEventListener("psg-safety-change", () => listeners.forEach((l) => l()));
  window.addEventListener("storage", (e) => { if (e.key === KEY) listeners.forEach((l) => l()); });
}
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

function read(): Report[] {
  if (!isBrowser) return EMPTY_REPORTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_REPORTS;
    if (cache?.raw === raw) return cache.value;
    const value = JSON.parse(raw) as Report[];
    cache = { raw, value };
    return value;
  } catch {
    return EMPTY_REPORTS;
  }
}
function write(list: Report[]) {
  if (!isBrowser) return;
  const raw = JSON.stringify(list);
  cache = { raw, value: list };
  localStorage.setItem(KEY, raw);
  window.dispatchEvent(new CustomEvent("psg-safety-change"));
}

function seed() {
  if (!isBrowser) return;
  if (localStorage.getItem(KEY)) return;
  const s: Report[] = [
    { id: "rep_1", createdAt: "Yesterday", reason: "Off-platform payment request", note: "Asked to pay via personal GCash", targetType: "conversation", targetId: "conv_sup_002", targetLabel: "Pampanga Fresh Catch Coop", status: "Open" },
    { id: "rep_2", createdAt: "3 days ago", reason: "Fake product", note: "Received substituted goods", targetType: "supplier", targetId: "sup_006", targetLabel: "Davao Cement & Hardware Corp.", status: "Dismissed" },
  ];
  write(s);
}
seed();

export function getReports() { return read(); }
export function useReports(): Report[] { return useSyncExternalStore(subscribe, read, () => EMPTY_REPORTS); }

export function createReport(r: Omit<Report, "id" | "createdAt" | "status">) {
  const all = read();
  all.unshift({ ...r, id: `rep_${Date.now()}`, createdAt: new Date().toLocaleString("en-PH", { dateStyle: "medium" }), status: "Open" });
  write(all);
}
export function updateReport(id: string, patch: Partial<Report>) {
  write(read().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export const RESTRICTED_CATEGORIES = [
  "Pharma", "Pharmaceutical & Health", "Medical Supplies", "Chemicals & Raw Materials",
  "Mining & Energy", "Personal Care & Cosmetics", "Food Manufacturing",
];
export function isRestrictedCategory(cat?: string) {
  if (!cat) return false;
  return RESTRICTED_CATEGORIES.some((c) => cat.toLowerCase().includes(c.toLowerCase()));
}

export const REPORT_REASONS = [
  "Scam or fraud",
  "Off-platform payment request",
  "Fake product",
  "Harassment",
  "Suspicious supplier",
  "Wrong documents",
  "Other",
];

// Full demo reset — wipes all demo state
export function resetAllDemoData() {
  if (!isBrowser) return;
  const keys = [
    "psg_conversations_v2",
    "psg_notifications_v1",
    "psg_safety_reports_v1",
    "psg_custom_requests_v1",
    "psg_custom_offers_v1",
    "psg_demo_orders_v1",
    "psg_cart_v1",
    "psg_saved_v1",
    "psg_demo_role_v1",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}
