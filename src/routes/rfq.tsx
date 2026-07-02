import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/rfq")({
  head: () => ({ meta: [{ title: "Get Supplier Quotes — PSG" }] }),
  component: RfqLayout,
});

function RfqLayout() {
  // Layout route — child routes render below. If someone hits /rfq exactly,
  // render the index component.
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/rfq" || path === "/rfq/") {
    // Lazy-import handled via child index route below; but we also want
    // a fallback in case there's no child match yet.
  }
  return <Outlet />;
}
