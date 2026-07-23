import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set New Password — PSG" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase recovery links deliver a session via the URL hash. Wait for
    // onAuthStateChange to fire (or for an existing session) before allowing
    // the form. If nothing arrives after a moment, show an error.
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (mounted) setReady(true);
      }
    });
    const t = setTimeout(() => {
      if (mounted && !ready) setError("This reset link is invalid or has expired. Request a new one.");
    }, 3500);
    return () => { mounted = false; sub.subscription.unsubscribe(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you're signed in.");
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="font-display text-2xl">Set a new password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a strong password you haven't used before.
          </p>

          {error ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-destructive/10 text-destructive p-3 text-sm">{error}</div>
              <Link to="/forgot-password" className="block text-center text-sm text-primary font-semibold">
                Request a new reset link
              </Link>
            </div>
          ) : !ready ? (
            <div className="mt-6 text-sm text-muted-foreground">Verifying reset link…</div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <input type="password" required minLength={6} placeholder="New password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" />
              <input type="password" required minLength={6} placeholder="Confirm new password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" />
              <button disabled={busy}
                className="w-full bg-primary text-primary-foreground rounded-md py-2.5 font-semibold hover:bg-primary/90 disabled:opacity-50">
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
