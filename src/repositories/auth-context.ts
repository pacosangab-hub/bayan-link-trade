import { supabase } from "@/integrations/supabase/client";
import type {
  AccountStatus,
  AdminPermissionKey,
  AppRole,
  AuthContext,
  IntendedAccountType,
} from "@/types/auth";
import { ADMIN_PERMISSION_KEYS, APP_ROLES } from "@/types/auth";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function parseAuthContext(raw: unknown): AuthContext | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const userId = typeof data.user_id === "string" ? data.user_id : null;
  if (!userId) return null;

  const roles = asStringArray(data.roles).filter((r): r is AppRole =>
    (APP_ROLES as readonly string[]).includes(r),
  );
  const permissions = asStringArray(data.permissions).filter((p): p is AdminPermissionKey =>
    (ADMIN_PERMISSION_KEYS as readonly string[]).includes(p),
  );

  const profileRaw =
    data.profile && typeof data.profile === "object"
      ? (data.profile as Record<string, unknown>)
      : null;

  const profile = profileRaw
    ? {
        id: String(profileRaw.id ?? userId),
        full_name: (profileRaw.full_name as string | null) ?? null,
        email: (profileRaw.email as string | null) ?? null,
        phone: (profileRaw.phone as string | null) ?? null,
        avatar_url: (profileRaw.avatar_url as string | null) ?? null,
        account_status: (profileRaw.account_status as AccountStatus | null) ?? null,
        intended_account_type:
          (profileRaw.intended_account_type as IntendedAccountType | null) ?? null,
        onboarding_completed_at: (profileRaw.onboarding_completed_at as string | null) ?? null,
        last_sign_in_at: (profileRaw.last_sign_in_at as string | null) ?? null,
      }
    : null;

  const businesses = Array.isArray(data.businesses)
    ? data.businesses
        .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
        .map((b) => ({
          id: String(b.id),
          business_name: String(b.business_name ?? ""),
          is_buyer: Boolean(b.is_buyer),
          is_supplier: Boolean(b.is_supplier),
          verification_status: String(b.verification_status ?? "unverified"),
          role_in_business: String(b.role_in_business ?? "member"),
        }))
    : [];

  return {
    user_id: userId,
    profile,
    roles,
    permissions,
    businesses,
  };
}

export async function fetchMyAuthContext(): Promise<AuthContext | null> {
  const { data, error } = await supabase.rpc("get_my_auth_context");
  if (error) throw error;
  return parseAuthContext(data);
}

export async function touchLastSignIn(): Promise<void> {
  const { error } = await supabase.rpc("touch_last_sign_in");
  if (error) throw error;
}
