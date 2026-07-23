import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { type AuthRole } from "@/lib/auth-store";
import { setSelfRole } from "@/lib/self-role.functions";
import { toast } from "sonner";
import { UserPlus, UserCog, Store, Users } from "lucide-react";
import { GoogleSignInButton, OrDivider } from "@/components/auth/GoogleSignInButton";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Account — PSG Supply Gateway" }] }),
  component: SignupPage,
});

const ACCOUNT_TYPES: { value: AuthRole; label: string; desc: string; icon: any }[] = [
  { value: "buyer", label: "Buyer", desc: "Find suppliers, request quotes, and place protected orders.", icon: UserCog },
  { value: "supplier", label: "Supplier", desc: "List products, receive buyer requests, and send custom offers.", icon: Store },
  { value: "both", label: "Buyer + Supplier", desc: "Buy and sell through one business account.", icon: Users },
];

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<AuthRole>("buyer");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      // If a session is available immediately (email confirmation off), persist
      // the chosen role server-side. Otherwise onboarding will do it after login.
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session && (role === "buyer" || role === "supplier" || role === "both")) {
        try { await setSelfRole({ data: { role } }); } catch { /* non-fatal */ }
      }
      toast.success("Account created — let's set up your business.");
      navigate({ to: "/onboarding", replace: true });
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }


  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
          <h1 className="font-display text-3xl">Create your PSG Supply Gateway account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join as a buyer, supplier, or both.</p>

          <div className="mt-6">
            <GoogleSignInButton redirectPath="/onboarding" />
          </div>
          <OrDivider />

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name">
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
            </Field>
            <Field label="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Password">
                <input type="password" required minLength={6} value={password}
                  onChange={(e) => setPassword(e.target.value)} className="input" />
              </Field>
              <Field label="Confirm password">
                <input type="password" required minLength={6} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} className="input" />
              </Field>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Account type</div>
              <div className="grid md:grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map(({ value, label, desc, icon: Icon }) => {
                  const active = role === value;
                  return (
                    <button type="button" key={value} onClick={() => setRole(value)}
                      className={`text-left border rounded-lg p-3 hover:border-primary/60 transition ${active ? "border-primary bg-primary/5" : ""}`}>
                      <Icon size={18} className={active ? "text-primary" : "text-muted-foreground"} />
                      <div className="font-semibold mt-2 text-sm">{label}</div>
                      <div className="text-[11px] text-muted-foreground leading-snug mt-1">{desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-3 font-semibold hover:bg-primary/90 disabled:opacity-50">
              <UserPlus size={16} /> {busy ? "Creating…" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold">Log in</Link>
          </div>
        </div>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-input);border-radius:.5rem;padding:.6rem .75rem;background:var(--color-background);font-size:.875rem}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-sm font-semibold mb-1">{label}</div>{children}</label>;
}
