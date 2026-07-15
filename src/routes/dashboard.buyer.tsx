import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy dashboard.buyer route → send buyers to the new Buyer Portal.
export const Route = createFileRoute("/dashboard/buyer")({
  beforeLoad: () => { throw redirect({ to: "/buyer-portal" }); },
  component: () => null,
});
