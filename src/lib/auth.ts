// Compatibility shim. New code should import from `@/lib/auth-store`.
// This keeps existing pages (which read `useSession().user`) working while
// the header + guards use the real auth state.
import { useQuery } from "@tanstack/react-query";
import { useAuth, signOutLocal, DEMO_USERS } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

// Shape older callers expect (mimics Supabase user with user_metadata).
function toLegacyUser(u: ReturnType<typeof useAuth>["user"]) {
  const source = u ?? DEMO_USERS.buyer; // fall back to demo buyer for old pages
  return {
    id: source.id,
    email: source.email,
    user_metadata: {
      full_name: source.fullName,
      business_name: source.businessName,
      role: source.role,
    },
  };
}

export function useSession() {
  const { user } = useAuth();
  const legacy = toLegacyUser(user);
  return {
    session: user ? ({ access_token: "local", user: legacy } as any) : null,
    user: legacy,
    loading: false,
  };
}

export function useMyBusinesses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-businesses", user?.id],
    queryFn: async () => [
      {
        id: "biz_local",
        business_name: user?.businessName || "Lola Nena's Carinderia Group",
        is_buyer: user?.role !== "supplier",
        is_supplier: user?.role === "supplier" || user?.role === "both",
      },
    ],
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => user?.role === "admin",
  });
}

export async function signOut() {
  try { await supabase.auth.signOut(); } catch { /* demo */ }
  signOutLocal();
}
