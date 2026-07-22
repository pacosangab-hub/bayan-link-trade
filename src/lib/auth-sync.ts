// Bridges Supabase Auth sessions into the local auth-store so the existing
// header, guards, and pages (which read useAuth()) work with Google OAuth.
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setAuthUser, getAuthUser, type AuthRole, type AuthUser } from "@/lib/auth-store";

function pickRole(u: User): AuthRole {
  const meta = (u.user_metadata || {}) as Record<string, unknown>;
  const raw = String(meta.role ?? "").toLowerCase();
  // Never trust admin from provider metadata — must be granted server-side.
  if (raw === "supplier") return "supplier";
  if (raw === "both") return "both";
  return "buyer";
}

export function toAuthUser(u: User): AuthUser {
  const meta = (u.user_metadata || {}) as Record<string, unknown>;
  const email = u.email || String(meta.email || "");
  const fullName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    email.split("@")[0] ||
    "PSG User";
  // Preserve any businessName we've already collected locally
  const existing = getAuthUser();
  return {
    id: u.id,
    email,
    fullName,
    role: existing?.id === u.id ? existing.role : pickRole(u),
    businessName: existing?.id === u.id ? existing.businessName : "",
    source: "supabase",
  };
}

let subscribed = false;

/** Called once from the root component. Hydrates from any existing Supabase
 *  session, then keeps the local auth-store mirrored via onAuthStateChange. */
export function startAuthSync(): () => void {
  if (subscribed) return () => {};
  subscribed = true;

  // Initial hydrate
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) setAuthUser(toAuthUser(data.session.user));
  });

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      setAuthUser(null);
      return;
    }
    if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
      if (session?.user) setAuthUser(toAuthUser(session.user));
    }
  });

  return () => {
    data.subscription.unsubscribe();
    subscribed = false;
  };
}
