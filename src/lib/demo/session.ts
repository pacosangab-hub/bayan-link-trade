// Demo role switcher — buyer / supplier / admin.
// Persisted in localStorage; hooks via useSyncExternalStore.
import { useSyncExternalStore } from "react";

export type DemoRole = "buyer" | "supplier" | "admin";

const KEY = "psg_demo_role_v1";
const isBrowser = typeof window !== "undefined";

const listeners = new Set<() => void>();
if (isBrowser) {
  window.addEventListener("psg-role-change", () => listeners.forEach((l) => l()));
  window.addEventListener("storage", (e) => { if (e.key === KEY) listeners.forEach((l) => l()); });
}

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

export function getRole(): DemoRole {
  if (!isBrowser) return "buyer";
  const v = localStorage.getItem(KEY);
  if (v === "supplier" || v === "admin" || v === "buyer") return v;
  return "buyer";
}

export function setRole(r: DemoRole) {
  if (!isBrowser) return;
  localStorage.setItem(KEY, r);
  window.dispatchEvent(new CustomEvent("psg-role-change"));
}

export function useDemoRole(): DemoRole {
  return useSyncExternalStore(subscribe, getRole, () => "buyer" as DemoRole);
}

export const BUYER_BUSINESS = "Lola Nena's Carinderia Group";
export const SUPPLIER_BUSINESS_ID = "sup_001"; // Bulacan Grain & Rice Mills (used when acting as supplier)
