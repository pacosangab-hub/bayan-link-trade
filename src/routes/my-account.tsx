import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/my-account")({
  beforeLoad: () => { throw redirect({ to: "/account" }); },
});
