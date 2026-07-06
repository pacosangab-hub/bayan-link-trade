// Demo auth — no backend. Returns a persistent demo buyer session.
import { useQuery } from "@tanstack/react-query";

const DEMO_USER = {
  id: "demo_user_1",
  email: "demo@psg.ph",
  user_metadata: {
    full_name: "Lola Nena's Carinderia Group",
  },
};

const DEMO_SESSION = {
  access_token: "demo",
  user: DEMO_USER,
} as any;

export function useSession() {
  return { session: DEMO_SESSION, user: DEMO_USER, loading: false };
}

export function useMyBusinesses() {
  return useQuery({
    queryKey: ["my-businesses"],
    queryFn: async () => [
      { id: "biz_demo", business_name: "Lola Nena's Carinderia Group", is_buyer: true, is_supplier: false },
    ],
  });
}

export function useIsAdmin() {
  return useQuery({ queryKey: ["is-admin"], queryFn: async () => true });
}

export async function signOut() {
  // demo mode — no-op
  return;
}
