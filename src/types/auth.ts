/** Shared auth / identity types for Phase 1. Keep UI AuthRole compatible. */

export const APP_ROLES = [
  "admin",
  "buyer",
  "supplier",
  "carrier",
  "user",
  "super_admin",
  "support",
  "finance_admin",
  "verification_admin",
  "operations_admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** UI-facing role used by existing RequireAuth / AppShell. */
export type AuthRole = "buyer" | "supplier" | "admin" | "both";

export const ADMIN_PERMISSION_KEYS = [
  "users.read",
  "users.manage",
  "businesses.read",
  "businesses.verify",
  "products.read",
  "products.moderate",
  "rfqs.read",
  "rfqs.manage",
  "quotes.read",
  "orders.read",
  "orders.manage",
  "shipments.read",
  "shipments.manage",
  "payments.read",
  "payments.manage",
  "disputes.read",
  "disputes.manage",
  "reviews.moderate",
  "messages.review",
  "reports.read",
  "audit_logs.read",
  "platform_settings.manage",
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];

export type IntendedAccountType = "buyer" | "supplier" | "both";
export type AccountStatus = "active" | "suspended" | "pending_verification" | "deleted";

export interface AuthBusinessSummary {
  id: string;
  business_name: string;
  is_buyer: boolean;
  is_supplier: boolean;
  verification_status: string;
  role_in_business: string;
}

export interface AuthProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_status: AccountStatus | null;
  intended_account_type: IntendedAccountType | null;
  onboarding_completed_at: string | null;
  last_sign_in_at: string | null;
}

export interface AuthContext {
  user_id: string;
  profile: AuthProfile | null;
  roles: AppRole[];
  permissions: AdminPermissionKey[];
  businesses: AuthBusinessSummary[];
}

export const ADMIN_APP_ROLES: readonly AppRole[] = [
  "admin",
  "super_admin",
  "support",
  "finance_admin",
  "verification_admin",
  "operations_admin",
] as const;

export function isAdminAppRole(role: string): boolean {
  return (ADMIN_APP_ROLES as readonly string[]).includes(role);
}

/** Map DB roles → UI AuthRole without inventing privileges. */
export function mapRolesToAuthRole(roles: readonly string[]): AuthRole {
  const set = new Set(roles);
  if ([...set].some(isAdminAppRole)) return "admin";
  const buyer = set.has("buyer");
  const supplier = set.has("supplier");
  if (buyer && supplier) return "both";
  if (supplier) return "supplier";
  return "buyer";
}

export function hasPermission(
  permissions: readonly string[],
  roles: readonly string[],
  key: AdminPermissionKey,
): boolean {
  if (roles.includes("super_admin")) return true;
  return permissions.includes(key);
}
