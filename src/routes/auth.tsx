import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
