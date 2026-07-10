import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/messages")({
  component: SupplierMessagesPage,
});

function SupplierMessagesPage() {
  return (
    <div className="rounded-lg border bg-card p-8 text-center space-y-3">
      <MessageSquare className="mx-auto text-muted-foreground" />
      <div className="font-semibold">Messages</div>
      <p className="text-sm text-muted-foreground">Continue conversations with buyers in the main Messages inbox.</p>
      <Link to="/messages" className="inline-flex text-sm px-4 py-2 rounded bg-primary text-primary-foreground font-semibold">
        Open Inbox
      </Link>
    </div>
  );
}
