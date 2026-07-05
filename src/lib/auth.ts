// Lightweight auth hook + business helper for PSG.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

/** Returns the businesses the current user owns or is a member of. */
export function useMyBusinesses() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["my-businesses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: mems, error: e1 } = await supabase
        .from("business_members")
        .select("business_id, role_in_business")
        .eq("user_id", user!.id);
      if (e1) throw e1;
      const ids = (mems || []).map((m) => m.business_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("businesses").select("*").in("id", ids);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useIsAdmin() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin");
      return (data || []).length > 0;
    },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}
