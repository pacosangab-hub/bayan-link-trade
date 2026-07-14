import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthUser, defaultPortalFor } from "@/lib/auth-store";

// /dashboard resolves to the correct portal based on role.
export const Route = createFileRoute("/dashboard/")({
  beforeLoad: () => {
    const user = getAuthUser();
    if (!user) throw redirect({ to: "/login" });
    throw redirect({ to: defaultPortalFor(user.role) });
  },
  component: () => null,
});
