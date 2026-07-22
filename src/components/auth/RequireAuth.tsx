// Route-level guard. Redirects unauthenticated users to /login and users
// without the required role to /unauthorized. Runs on the client.
// Server RLS/RPCs remain the authority for permissions.
import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, type AuthRole } from "@/lib/auth-store";

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: AuthRole[];
}) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (s) => s.location.pathname + s.location.searchStr,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", search: { redirect: pathname }, replace: true });
      return;
    }
    if (user?.accountStatus === "suspended") {
      navigate({ to: "/unauthorized", replace: true });
      return;
    }
    if (roles && roles.length && !hasRole(...roles)) {
      navigate({ to: "/unauthorized", replace: true });
    }
  }, [isAuthenticated, user?.role, user?.accountStatus, roles?.join(","), pathname]);

  if (!isAuthenticated) return null;
  if (user?.accountStatus === "suspended") return null;
  if (roles && roles.length && !hasRole(...roles)) return null;
  return <>{children}</>;
}
