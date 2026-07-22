import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setAuthUser, getAuthUser } from "@/lib/auth-store";
import { toAuthUser } from "@/lib/auth-sync";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing you in — PSG" }] }),
  component: AuthCallback,
});

function safePath(p: string | null | undefined): string {
  if (!p) return "/";
  if (!p.startsWith("/") || p.startsWith("//")) return "/";
  return p;
}

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      const { data, error: authErr } = await supabase.auth.getUser();

      if (authErr && attempts > 40) {
        if (!cancelled) setError("We could not complete Google sign-in. Please try again.");
        return;
      }

      const user = data?.user;
      if (!user) {
        if (attempts > 40) {
          if (!cancelled) setError("Sign-in timed out. Please try again.");
          return;
        }
        setTimeout(poll, 250);
        return;
      }

      // Hydrate local auth-store (root listener also does this, but do it
      // synchronously here so guards don't flicker on first navigation).
      setAuthUser(toAuthUser(user));

      // Route the user
      let dest = "/";
      try {
        dest = safePath(sessionStorage.getItem("psg_post_login_redirect"));
        sessionStorage.removeItem("psg_post_login_redirect");
      } catch { /* ignore */ }

      // First-time user (no businessName captured yet) → onboarding
      const local = getAuthUser();
      const firstTime = !local?.businessName;
      if (firstTime) {
        try { sessionStorage.setItem("psg_post_onboarding_redirect", dest); } catch { /* ignore */ }
        if (!cancelled) navigate({ to: "/onboarding", replace: true });
        return;
      }

      if (!cancelled) navigate({ to: dest as any, replace: true });
    }

    void poll();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="max-w-sm w-full text-center rounded-xl border bg-card p-8 shadow-sm">
        {error ? (
          <>
            <AlertCircle size={32} className="mx-auto text-destructive" />
            <h1 className="mt-3 font-display text-xl">Sign-in failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate({ to: "/login", replace: true })}
              className="mt-5 w-full bg-primary text-primary-foreground font-semibold rounded-md py-2.5 hover:bg-primary/90"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <Loader2 size={32} className="mx-auto text-primary animate-spin" />
            <h1 className="mt-3 font-display text-xl">Signing you in…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Finishing your Google sign-in with PSG. This only takes a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
