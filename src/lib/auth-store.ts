// Client-side auth store. Backs demo login and mirrors real Supabase sessions
// so the header + guards have a single source of truth.
import { useSyncExternalStore } from "react";

export type AuthRole = "buyer" | "supplier" | "admin" | "both";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
  businessName: string;
  source: "demo" | "supabase";
  onboardingCompleted?: boolean;
}

const KEY = "psg_auth_v2";
const EVT = "psg-auth-change";
const isBrowser = typeof window !== "undefined";

const listeners = new Set<() => void>();
if (isBrowser) {
  window.addEventListener(EVT, () => listeners.forEach((l) => l()));
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) listeners.forEach((l) => l());
  });
}

function emit() {
  if (isBrowser) window.dispatchEvent(new CustomEvent(EVT));
}

let cachedRaw: string | null | undefined;
let cachedUser: AuthUser | null = null;

export function getAuthUser(): AuthUser | null {
  if (!isBrowser) return null;
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { raw = null; }
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    cachedUser = raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

export function setAuthUser(user: AuthUser | null) {
  if (!isBrowser) return;
  if (user) localStorage.setItem(KEY, JSON.stringify(user));
  else localStorage.removeItem(KEY);
  cachedRaw = undefined;
  emit();
}

export function patchAuthUser(patch: Partial<AuthUser>) {
  const cur = getAuthUser();
  if (!cur) return;
  setAuthUser({ ...cur, ...patch });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getAuthUser, () => null);
  return {
    user,
    isAuthenticated: !!user,
    role: user?.role ?? null,
    hasRole(...roles: AuthRole[]) {
      if (!user) return false;
      if (user.role === "admin") return roles.includes("admin") || roles.length === 0 || roles.includes("buyer") || roles.includes("supplier") || roles.includes("both");
      if (user.role === "both") return roles.includes("buyer") || roles.includes("supplier") || roles.includes("both");
      return roles.includes(user.role);
    },
  };
}

// Returns the correct portal route for a given role.
export function defaultPortalFor(role: AuthRole | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "supplier") return "/supplier-portal";
  // buyer and both → buyer portal (both can switch)
  return "/buyer-portal";
}

// Demo presets — all marked onboardingCompleted so demo login jumps straight to the portal.
export const DEMO_USERS: Record<"buyer" | "supplier" | "admin", AuthUser> = {
  buyer: {
    id: "demo_buyer",
    email: "stefano@lolanenas.ph",
    fullName: "Stefano San Gabriel",
    role: "buyer",
    businessName: "Lola Nena's Carinderia Group",
    source: "demo",
    onboardingCompleted: true,
  },
  supplier: {
    id: "demo_supplier",
    email: "admin@bulacangrain.ph",
    fullName: "Supplier Admin",
    role: "supplier",
    businessName: "Bulacan Grain & Rice Mills Inc.",
    source: "demo",
    onboardingCompleted: true,
  },
  admin: {
    id: "demo_admin",
    email: "admin@psg.ph",
    fullName: "PSG Admin",
    role: "admin",
    businessName: "PSG Supply Gateway",
    source: "demo",
    onboardingCompleted: true,
  },
};

export function signOutLocal() {
  setAuthUser(null);
}
