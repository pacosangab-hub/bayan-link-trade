import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USERS, setAuthUser, useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { LogIn, UserCog, Store, ShieldCheck } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — PSG Supply Gateway" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const target = redirect || "/";

  useEffect(() => {
    if (isAuthenticated) navigate({ to: target, replace: true });
  }, [isAuthenticated, target]);

  function go() { navigate({ to: target, replace: true }); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        setAuthUser({
          id: data.user.id,
          email: data.user.email || email,
          fullName: (data.user.user_metadata?.full_name as string) || email,
          role: ((data.user.user_metadata?.role as any) || "buyer"),
          businessName: (data.user.user_metadata?.business_name as string) || "",
          source: "supabase",
        });
        toast.success("Welcome back!");
        go();
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function demoLogin(kind: "buyer" | "supplier" | "admin") {
    setAuthUser(DEMO_USERS[kind]);
    toast.success(`Signed in as ${DEMO_USERS[kind].fullName}`);
    go();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="font-display text-3xl">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log in to source products, message suppliers, and manage protected orders.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <input type="email" required placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm" />
            <input type="password" required minLength={6} placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm" />
            <button disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2.5 font-semibold hover:bg-primary/90 disabled:opacity-50">
              <LogIn size={16} /> {busy ? "Signing in…" : "Log In"}
            </button>
          </form>

          <div className="mt-3 flex items-center justify-between text-sm">
            <Link to="/signup" className="text-primary font-semibold">Create Account</Link>
            <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">Forgot Password?</Link>
          </div>

          <div className="my-5 flex items-center gap-2">
            <div className="h-px bg-border flex-1" />
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">demo accounts</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="grid gap-2">
            <button onClick={() => demoLogin("buyer")}
              className="w-full inline-flex items-center gap-2 border rounded-md py-2 px-3 text-sm hover:bg-muted text-left">
              <UserCog size={16} className="text-primary" />
              <span className="flex-1"><b>Continue as Buyer</b><div className="text-[11px] text-muted-foreground">Paco · Lola Nena's Carinderia Group</div></span>
            </button>
            <button onClick={() => demoLogin("supplier")}
              className="w-full inline-flex items-center gap-2 border rounded-md py-2 px-3 text-sm hover:bg-muted text-left">
              <Store size={16} className="text-primary" />
              <span className="flex-1"><b>Continue as Supplier</b><div className="text-[11px] text-muted-foreground">Bulacan Grain & Rice Mills Inc.</div></span>
            </button>
            <button onClick={() => demoLogin("admin")}
              className="w-full inline-flex items-center gap-2 border rounded-md py-2 px-3 text-sm hover:bg-muted text-left">
              <ShieldCheck size={16} className="text-primary" />
              <span className="flex-1"><b>Continue as Admin</b><div className="text-[11px] text-muted-foreground">PSG Supply Gateway</div></span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
