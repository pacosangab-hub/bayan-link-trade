// Bridges Supabase Auth sessions into the local auth-store so the existing
// header, guards, and pages (which read useAuth()) work with real auth.
// The role is derived from the public.user_roles table (source of truth),
// never from client-controllable user_metadata.
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setAuthUser, getAuthUser, type AuthRole, type AuthUser } from "@/lib/auth-store";

const ROLE_PRIORITY: AuthRole[] = ["super_admin", "admin", "supplier", "buyer", "both"];

async function fetchRole(userId: string): Promise<AuthRole> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = new Set((data ?? []).map((r: any) => r.role as AuthRole));
    for (const r of ROLE_PRIORITY) if (roles.has(r)) return r;
  } catch { /* fall through */ }
  return "buyer";
}

export function toAuthUser(u: User, role: AuthRole = "buyer"): AuthUser {
  const meta = (u.user_metadata || {}) as Record<string, unknown>;
  const email = u.email || String(meta.email || "");
  const fullName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    email.split("@")[0] ||
    "PSG User";
  const existing = getAuthUser();
  return {
    id: u.id,
    email,
    fullName,
    role,
    businessName: existing?.id === u.id ? existing.businessName : "",
    source: "supabase",
  };
}

async function hydrate(u: User) {
  const role = await fetchRole(u.id);
  setAuthUser(toAuthUser(u, role));
}

let subscribed = false;

export function startAuthSync(): () => void {
  if (subscribed) return () => {};
  subscribed = true;

  void supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) void hydrate(data.session.user);
  });

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      setAuthUser(null);
      return;
    }
    if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
      if (session?.user) void hydrate(session.user);
    }
  });

  return () => {
    data.subscription.unsubscribe();
    subscribed = false;
  };
}
