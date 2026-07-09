// Notifications store — per-role inbox, localStorage-backed.
import { useSyncExternalStore } from "react";
import type { DemoRole } from "./session";

export type NotifKind =
  | "message"
  | "custom_request"
  | "custom_offer"
  | "order"
  | "escrow"
  | "dispute"
  | "system";

export type Notification = {
  id: string;
  role: DemoRole;
  kind: NotifKind;
  title: string;
  body: string;
  href?: string;
  at: string;
  read: boolean;
};

const KEY = "psg_notifications_v1";
const isBrowser = typeof window !== "undefined";
const listeners = new Set<() => void>();
const EMPTY_NOTIFICATIONS: Notification[] = [];
let cache: { raw: string; value: Notification[] } | undefined;
const roleCache = new Map<DemoRole, { source: Notification[]; value: Notification[] }>();

if (isBrowser) {
  window.addEventListener("psg-notif-change", () => listeners.forEach((l) => l()));
  window.addEventListener("storage", (e) => { if (e.key === KEY) listeners.forEach((l) => l()); });
}
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

function read(): Notification[] {
  if (!isBrowser) return EMPTY_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_NOTIFICATIONS;
    if (cache?.raw === raw) return cache.value;
    const value = JSON.parse(raw) as Notification[];
    cache = { raw, value };
    roleCache.clear();
    return value;
  } catch {
    return EMPTY_NOTIFICATIONS;
  }
}
function write(list: Notification[]) {
  if (!isBrowser) return;
  const raw = JSON.stringify(list);
  cache = { raw, value: list };
  roleCache.clear();
  localStorage.setItem(KEY, raw);
  window.dispatchEvent(new CustomEvent("psg-notif-change"));
}

function nowLabel() {
  return new Date().toLocaleString("en-PH", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

function seed() {
  if (!isBrowser) return;
  if (localStorage.getItem(KEY)) return;
  const s: Notification[] = [
    { id: "n_1", role: "buyer", kind: "custom_offer", title: "New custom offer received", body: "Bulacan Grain & Rice Mills sent an offer for 500 kg rice.", href: "/messages", at: "Just now", read: false },
    { id: "n_2", role: "buyer", kind: "order", title: "Order ORD_24011 preparing", body: "Supplier is packing your order.", href: "/orders/ord_24011", at: "1h ago", read: false },
    { id: "n_3", role: "buyer", kind: "message", title: "New message from Cavite Roasters", body: "Cupping at our roastery Saturday 10 AM?", href: "/messages", at: "2h ago", read: true },
    { id: "n_4", role: "supplier", kind: "custom_request", title: "New custom request", body: "Lola Nena's Carinderia Group requested 500 kg rice/month.", href: "/messages", at: "2h ago", read: false },
    { id: "n_5", role: "supplier", kind: "order", title: "New order ORD_24011", body: "40 sacks of premium rice — escrow funded.", href: "/orders/ord_24011", at: "1h ago", read: false },
    { id: "n_6", role: "admin", kind: "dispute", title: "Open dispute needs review", body: "Order ord_23944 — short shipment", href: "/admin/safety", at: "1d ago", read: false },
  ];
  write(s);
}
seed();

export function getAllNotifications(): Notification[] { return read(); }
export function getForRole(role: DemoRole): Notification[] {
  const all = read();
  const cached = roleCache.get(role);
  if (cached?.source === all) return cached.value;
  const value = all.filter((n) => n.role === role).sort((a, b) => Number(a.read) - Number(b.read));
  roleCache.set(role, { source: all, value });
  return value;
}
export function unreadCount(role: DemoRole): number {
  return read().filter((n) => n.role === role && !n.read).length;
}

export function pushNotification(n: Omit<Notification, "id" | "at" | "read">) {
  const all = read();
  all.unshift({ ...n, id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: nowLabel(), read: false });
  write(all.slice(0, 200));
}

export function markRead(id: string) {
  write(read().map((n) => (n.id === id ? { ...n, read: true } : n)));
}
export function markAllRead(role: DemoRole) {
  write(read().map((n) => (n.role === role ? { ...n, read: true } : n)));
}

export function useNotificationsForRole(role: DemoRole): Notification[] {
  return useSyncExternalStore(subscribe, () => getForRole(role), () => EMPTY_NOTIFICATIONS);
}
export function useUnreadCount(role: DemoRole): number {
  return useSyncExternalStore(subscribe, () => unreadCount(role), () => 0);
}
