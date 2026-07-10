import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — PSG Supply Gateway" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName || email },
          },
        });
        if (error) throw error;
        toast.success("Account created — you can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message || "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <ShieldCheck size={18} />
            <span className="text-xs uppercase tracking-widest font-bold">PSG Account</span>
          </div>
          <h1 className="font-display text-2xl">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Access RFQs, offers, and escrow-protected orders." : "One account for buyers, suppliers, and carriers."}
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Full name"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            )}
            <input type="email" className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Password (min 6)"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <button disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold rounded-md py-2.5 hover:bg-primary/90 disabled:opacity-50">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-2">
            <div className="h-px bg-border flex-1" />
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (result.error) throw result.error;
                if (result.redirected) return;
                toast.success("Signed in with Google");
                navigate({ to: "/" });
              } catch (err: any) {
                toast.error(err.message || "Google sign-in failed");
              } finally {
                setBusy(false);
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 border bg-card font-semibold rounded-md py-2.5 hover:bg-muted disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 34.7 44 29.8 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
            Continue with Google
          </button>


          <div className="mt-4 text-sm text-center">
            {mode === "signin" ? (
              <>New to PSG? <button className="text-primary font-semibold" onClick={() => setMode("signup")}>Create an account</button></>
            ) : (
              <>Already have an account? <button className="text-primary font-semibold" onClick={() => setMode("signin")}>Sign in</button></>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Back to marketplace</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
