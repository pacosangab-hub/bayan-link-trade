import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/buyer-dashboard")({
  beforeLoad: () => { throw redirect({ to: "/buyer-portal" }); },
});
