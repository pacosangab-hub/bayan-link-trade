import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy alias — buyer dashboard is now the Buyer Portal.
export const Route = createFileRoute("/buyer-dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/buyer-portal" });
  },
  component: () => null,
});
