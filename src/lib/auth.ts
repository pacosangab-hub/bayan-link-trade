// Compatibility shim. New code should import from `@/lib/auth-store` / `@/services/auth`.
import { useQuery } from "@tanstack/react-query";
import { useAuth, signOutLocal, DEMO_USERS } from "@/lib/auth-store";
import { signOutEverywhere } from "@/services/auth";

function toLegacyUser(u: ReturnType<typeof useAuth>["user"]) {
  const source = u ?? DEMO_USERS.buyer;
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
    session: user
      ? ({ access_token: user.source === "supabase" ? "supabase" : "local", user: legacy } as {
          access_token: string;
          user: ReturnType<typeof toLegacyUser>;
        })
      : null,
    user: legacy,
    loading: false,
  };
}

export function useMyBusinesses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-businesses", user?.id, user?.businesses?.map((b) => b.id).join(",")],
    queryFn: async () => {
      if (user?.businesses && user.businesses.length > 0) {
        return user.businesses.map((b) => ({
          id: b.id,
          business_name: b.business_name,
          is_buyer: b.is_buyer,
          is_supplier: b.is_supplier,
        }));
      }
      return [
        {
          id: "biz_local",
          business_name: user?.businessName || "Lola Nena's Carinderia Group",
          is_buyer: user?.role !== "supplier",
          is_supplier: user?.role === "supplier" || user?.role === "both",
        },
      ];
    },
  });
}

export function useIsAdmin() {
  const { user, hasRole } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id, user?.roles?.join(",")],
    queryFn: async () => hasRole("admin"),
  });
}

export async function signOut() {
  try {
    await signOutEverywhere();
  } catch {
    /* demo / offline */
  }
  signOutLocal();
}
