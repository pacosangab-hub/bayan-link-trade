import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy alias — the buyer onboarding is now part of the unified /onboarding flow.
export const Route = createFileRoute("/onboarding/buyer")({
  beforeLoad: () => {
    throw redirect({ to: "/onboarding" });
  },
  component: () => null,
});
