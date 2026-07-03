import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/custom-requests")({
  component: () => <Outlet />,
});
