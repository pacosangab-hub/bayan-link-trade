import { createFileRoute } from "@tanstack/react-router";
import { DemoSafetyCenter } from "@/components/admin/DemoSafetyCenter";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Safety Center — PSG" }] }),
  component: DemoSafetyCenter,
});