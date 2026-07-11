// Global "login to continue" modal, triggered by protected actions.
import { useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { X, LogIn, UserPlus } from "lucide-react";

const listeners = new Set<() => void>();
let state: { open: boolean; intent?: string; redirect?: string } = { open: false };

function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function get() { return state; }

export function requireLogin(opts?: { intent?: string; redirect?: string }) {
  state = { open: true, intent: opts?.intent, redirect: opts?.redirect ?? (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/") };
  emit();
}
export function closeLoginModal() {
  state = { open: false };
  emit();
}

export function LoginModal() {
  const s = useSyncExternalStore(subscribe, get, () => ({ open: false } as typeof state));
  if (!s.open) return null;
  const redirectQs = s.redirect ? `?redirect=${encodeURIComponent(s.redirect)}` : "";
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 grid place-items-center px-4" onClick={closeLoginModal}>
      <div className="bg-card rounded-xl border shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl">Log in to continue</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {s.intent
                ? `Sign in to ${s.intent}.`
                : "Create a free account to message suppliers, request quotes, and manage protected orders."}
            </p>
          </div>
          <button onClick={closeLoginModal} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link
            to="/login"
            search={{ redirect: s.redirect ?? "/" }}
            onClick={closeLoginModal}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2.5 font-semibold hover:bg-primary/90"
          >
            <LogIn size={16} /> Log in
          </Link>
          <Link
            to="/signup"
            onClick={closeLoginModal}
            className="inline-flex items-center justify-center gap-2 border bg-card rounded-md py-2.5 font-semibold hover:bg-muted"
          >
            <UserPlus size={16} /> Create account
          </Link>
        </div>
        <p className="mt-4 text-xs text-center text-muted-foreground">
          Just exploring? <Link to="/login" search={{ redirect: s.redirect ?? "/" }} onClick={closeLoginModal} className="text-primary font-semibold">Use a demo account</Link>.
        </p>
        <span className="hidden">{redirectQs}</span>
      </div>
    </div>
  );
}
