import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated: buyer dashboard now lives at /buyer-portal.
export const Route = createFileRoute("/dashboard/buyer")({
  beforeLoad: () => {
    throw redirect({ to: "/buyer-portal" });
  },
  component: () => null,
});
