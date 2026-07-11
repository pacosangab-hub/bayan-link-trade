import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — PSG" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent — check your email.");
    } catch (err: any) {
      // Still show the confirmation to avoid leaking whether an email exists.
      setSent(true);
      toast.message("If that email is registered, a reset link has been sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="font-display text-2xl">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we'll send you a reset link.
          </p>
          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-success/10 text-success p-3 text-sm">
                If <b>{email}</b> is registered, a reset link is on its way.
              </div>
              <Link to="/login" className="block text-center text-sm text-primary font-semibold">
                ← Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <input type="email" required placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" />
              <button disabled={busy}
                className="w-full bg-primary text-primary-foreground rounded-md py-2.5 font-semibold hover:bg-primary/90 disabled:opacity-50">
                {busy ? "Sending…" : "Send reset link"}
              </button>
              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-primary">
                ← Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
