import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RequireAuth roles={["admin"]}>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </RequireAuth>
  ),
});
