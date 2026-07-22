import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthUser, setAuthUser, signOutLocal } from "@/lib/auth-store";
import { hydrateSessionUser } from "@/services/auth";

let started = false;

/**
 * Keep psg_auth_v2 aligned with Supabase session for real users.
 * Demo users are left untouched until they sign out.
 */
export function startAuthSessionSync() {
  if (typeof window === "undefined" || started) return;
  started = true;

  void (async () => {
    const current = getAuthUser();
    if (current?.source === "demo") return;
    try {
      const user = await hydrateSessionUser();
      if (user) setAuthUser(user);
      else if (current?.source === "supabase") signOutLocal();
    } catch {
      // Keep existing local mirror if network/RPC unavailable.
    }
  })();

  supabase.auth.onAuthStateChange((event, session) => {
    const current = getAuthUser();
    if (current?.source === "demo") return;

    if (event === "SIGNED_OUT" || !session) {
      if (current?.source === "supabase") signOutLocal();
      return;
    }

    void hydrateSessionUser(session.user.email || "")
      .then((user) => {
        if (user) setAuthUser(user);
      })
      .catch(() => {
        /* ignore transient hydration errors */
      });
  });
}

/** Hook for root layout to start sync once. */
export function useAuthSessionSync() {
  useEffect(() => {
    startAuthSessionSync();
  }, []);
}
