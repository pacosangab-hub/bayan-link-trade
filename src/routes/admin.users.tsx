import { createFileRoute, redirect } from "@tanstack/react-router";

// /admin/users is a legacy alias — send admins to Buyers by default.
export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/buyers" });
  },
});
