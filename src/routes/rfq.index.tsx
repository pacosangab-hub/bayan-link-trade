import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/rfq/")({
  beforeLoad: () => { throw redirect({ to: "/rfq-center" }); },
});
