// Route-level guard. Redirects unauthenticated users to /login, users
// with wrong role to their default portal, and users who have not
// completed onboarding to /onboarding.
import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, defaultPortalFor, type AuthRole } from "@/lib/auth-store";

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: AuthRole[];
}) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const dispatched = useRef<string | null>(null);

  const allowed =
    isAuthenticated && (!roles || roles.length === 0 || hasRole(...roles));

  useEffect(() => {
    if (isAuthenticated && user && user.onboardingCompleted === false) {
      if (dispatched.current === "onboarding") return;
      dispatched.current = "onboarding";
      navigate({ to: "/onboarding", replace: true });
      return;
    }
    if (!isAuthenticated) {
      if (dispatched.current === "login") return;
      dispatched.current = "login";
      navigate({ to: "/login", search: { redirect: pathname }, replace: true });
      return;
    }
    if (roles && roles.length && !hasRole(...roles)) {
      const target = defaultPortalFor(user?.role ?? null);
      if (dispatched.current === target) return;
      dispatched.current = target;
      navigate({ to: target, replace: true });
      return;
    }
    dispatched.current = null;
  }, [isAuthenticated, user?.role, user?.onboardingCompleted, roles?.join(",")]);

  if (!allowed) return null;
  return <>{children}</>;
}
