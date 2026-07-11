import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "Access Denied — PSG" }] }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="size-16 mx-auto rounded-full bg-destructive/10 text-destructive grid place-items-center">
          <ShieldAlert size={32} />
        </div>
        <h1 className="font-display text-3xl mt-4">You do not have access to this page</h1>
        <p className="text-muted-foreground mt-2">
          This section is only available to the correct account type.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-semibold">
            Go back to dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
