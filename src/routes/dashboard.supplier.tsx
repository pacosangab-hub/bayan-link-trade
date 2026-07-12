import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated: the supplier command center now lives entirely at /supplier-portal.
export const Route = createFileRoute("/dashboard/supplier")({
  beforeLoad: () => {
    throw redirect({ to: "/supplier-portal" });
  },
  component: () => null,
});
