import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RequireAuth roles={["admin"]}>
      <Outlet />
    </RequireAuth>
  ),
});
