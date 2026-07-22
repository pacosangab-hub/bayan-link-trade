import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  /** Same-origin path to return to after Google finishes. Defaults to "/". */
  redirectPath?: string;
  /** Called after a successful in-place (popup) sign-in. Full-page redirects will just navigate. */
  onSuccess?: () => void;
  className?: string;
  label?: string;
};

/**
 * "Continue with Google" — full-width, white, matches existing form buttons.
 * Uses Lovable Cloud's managed Google OAuth (iframe/preview-safe).
 * The provider redirect returns to the app; we stash the intended path in
 * sessionStorage so /auth/callback can send the user back.
 */
export function GoogleSignInButton({ redirectPath = "/", onSuccess, className, label = "Continue with Google" }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      // Stash intended destination (safe: rejected upstream if not same-origin path)
      const safe = redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//")
        ? redirectPath
        : "/";
      try { sessionStorage.setItem("psg_post_login_redirect", safe); } catch { /* ignore */ }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });

      if (result.error) {
        const msg = String((result.error as Error)?.message || "");
        if (/cancel|closed|denied/i.test(msg)) {
          toast.error("Google sign-in was cancelled.");
        } else {
          console.error("[GoogleSignIn]", result.error);
          toast.error("We could not complete Google sign-in. Please try again.");
        }
        setBusy(false);
        return;
      }
      if (result.redirected) return; // browser is navigating away
      // In-place (popup) success — session already set
      onSuccess?.();
    } catch (err) {
      console.error("[GoogleSignIn]", err);
      toast.error("We could not complete Google sign-in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={label}
      className={
        className ??
        "w-full inline-flex items-center justify-center gap-2 border bg-card font-semibold rounded-md py-2.5 hover:bg-muted disabled:opacity-50 transition"
      }
    >
      {busy ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Connecting to Google…
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 34.7 44 29.8 44 24c0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

/** Renders "──── OR ────" — matches existing dividers on auth screens. */
export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-4 flex items-center gap-2">
      <div className="h-px bg-border flex-1" />
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="h-px bg-border flex-1" />
    </div>
  );
}
