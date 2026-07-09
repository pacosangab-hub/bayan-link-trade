import { createFileRoute } from "@tanstack/react-router";
import { DemoSafetyCenter } from "@/components/admin/DemoSafetyCenter";

export const Route = createFileRoute("/admin/safety")({
  head: () => ({ meta: [{ title: "Safety Center — PSG" }] }),
  component: DemoSafetyCenter,
});