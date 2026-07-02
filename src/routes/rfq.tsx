import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/rfq")({
  head: () => ({ meta: [{ title: "Get Supplier Quotes — PSG" }] }),
  component: () => <Outlet />,
});
