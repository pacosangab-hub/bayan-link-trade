// Client-side auth store. Mirrors Supabase session + DB roles/permissions.
// Demo accounts remain for local UX demos only and never invent DB admin rights
// for real Supabase sessions.
import { useSyncExternalStore } from "react";
import type { AdminPermissionKey, AppRole, AuthBusinessSummary, AuthRole } from "@/types/auth";
import { hasPermission, isAdminAppRole, mapRolesToAuthRole } from "@/types/auth";

export type { AuthRole };

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  /** UI-facing primary role for existing navigation/guards. */
  role: AuthRole;
  businessName: string;
  source: "demo" | "supabase";
  roles?: AppRole[];
  permissions?: AdminPermissionKey[];
  businesses?: AuthBusinessSummary[];
  accountStatus?: string;
  onboardingCompletedAt?: string | null;
  awaitingEmailConfirmation?: boolean;
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
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
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

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getAuthUser, () => null);
  const roles = user?.roles ?? (user ? [user.role === "both" ? "buyer" : user.role] : []);
  const normalizedRoles: string[] =
    user?.role === "both"
      ? Array.from(new Set([...roles.map(String), "buyer", "supplier"]))
      : roles.map(String);

  return {
    user,
    isAuthenticated: !!user,
    role: user?.role ?? null,
    roles: normalizedRoles,
    permissions: user?.permissions ?? [],
    hasRole(...needed: AuthRole[]) {
      if (!user) return false;
      // Demo admin remains for local demos only.
      if (user.source === "demo" && user.role === "admin") return true;
      if (normalizedRoles.some(isAdminAppRole) || user.role === "admin") {
        if (needed.includes("admin")) return true;
      }
      return needed.some((n) => {
        if (n === "admin") return user.role === "admin" || normalizedRoles.some(isAdminAppRole);
        if (n === "both") return user.role === "both" || (normalizedRoles.includes("buyer") && normalizedRoles.includes("supplier"));
        if (n === "buyer") return user.role === "buyer" || user.role === "both" || normalizedRoles.includes("buyer");
        if (n === "supplier") return user.role === "supplier" || user.role === "both" || normalizedRoles.includes("supplier");
        return false;
      });
    },
    can(permission: AdminPermissionKey) {
      if (!user) return false;
      if (user.source === "demo" && user.role === "admin") return true;
      return hasPermission(user.permissions ?? [], normalizedRoles, permission);
    },
  };
}

/** Demo presets — UI-only. Do not treat as proof of DB privileges. */
export const DEMO_USERS: Record<"buyer" | "supplier" | "admin", AuthUser> = {
  buyer: {
    id: "demo_buyer",
    email: "paco@lolanenas.ph",
    fullName: "Paco Reyes",
    role: "buyer",
    businessName: "Lola Nena's Carinderia Group",
    source: "demo",
    roles: ["buyer"],
    permissions: [],
  },
  supplier: {
    id: "demo_supplier",
    email: "admin@bulacangrain.ph",
    fullName: "Supplier Admin",
    role: "supplier",
    businessName: "Bulacan Grain & Rice Mills Inc.",
    source: "demo",
    roles: ["supplier"],
    permissions: [],
  },
  admin: {
    id: "demo_admin",
    email: "admin@psg.ph",
    fullName: "PSG Admin",
    role: "admin",
    businessName: "PSG Supply Gateway",
    source: "demo",
    roles: ["super_admin"],
    permissions: [],
  },
};

export function signOutLocal() {
  setAuthUser(null);
}

export function deriveAuthRoleFromRoles(roles: readonly string[]): AuthRole {
  return mapRolesToAuthRole(roles);
}

/** Demo auth buttons stay available in non-production builds and when explicitly enabled. */
export function isDemoAuthEnabled(): boolean {
  if (!isBrowser) return false;
  if (import.meta.env.VITE_ENABLE_DEMO_AUTH === "true") return true;
  if (import.meta.env.VITE_ENABLE_DEMO_AUTH === "false") return false;
  return import.meta.env.DEV;
}
