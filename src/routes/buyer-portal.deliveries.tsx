import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { orders as MOCK, supplierById } from "@/lib/mock-data";
import { seedDemoDeliveries, useAllDeliveries, DELIVERY_METHOD_BADGES, DELIVERY_STATUS_LABELS, deliveryStatusTone, type DeliveryMethod } from "@/lib/delivery";

export const Route = createFileRoute("/buyer-portal/deliveries")({
  component: BuyerDeliveries,
});

type FilterKey = "all" | DeliveryMethod | "in_transit" | "delivered" | "needs_confirm";

function BuyerDeliveries() {
  useEffect(() => { seedDemoDeliveries(); }, []);
  const deliveries = useAllDeliveries();
  const [filter, setFilter] = useState<FilterKey>("all");

  const rows = useMemo(() => {
    const entries = Object.entries(deliveries);
    return entries.filter(([, d]) => {
      if (filter === "all") return true;
      if (filter === "in_transit") return d.status === "in_transit" || d.status === "out_for_delivery";
      if (filter === "delivered") return d.status === "delivered" || d.status === "completed" || d.status === "buyer_confirmed";
      if (filter === "needs_confirm") return d.status === "delivered" || d.status === "ready_for_pickup";
      return d.method === filter;
    });
  }, [deliveries, filter]);

  const chips: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pickup_warehouse", label: "Pickup" },
    { key: "third_party_carrier", label: "3rd-Party" },
    { key: "supplier_owned_logistics", label: "Supplier Logistics" },
    { key: "in_transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
    { key: "needs_confirm", label: "Needs Confirmation" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Deliveries ({rows.length})</h2>

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button key={c.key} onClick={() => setFilter(c.key)}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${filter === c.key ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Order</th>
              <th className="text-left px-2">Supplier</th>
              <th className="text-left px-2">Delivery Method</th>
              <th className="text-left px-2">Status</th>
              <th className="text-left px-2">ETA</th>
              <th className="text-left px-2">Tracking</th>
              <th className="text-right px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-10">No deliveries in this filter.</td></tr>
            )}
            {rows.map(([id, d]) => {
              const order = MOCK.find((o) => o.id === id);
              const s = order ? supplierById(order.supplierId) : null;
              return (
                <tr key={id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{id.toUpperCase()}</td>
                  <td className="px-2">{s?.name || "—"}</td>
                  <td className="px-2"><span className="chip">{DELIVERY_METHOD_BADGES[d.method]}</span></td>
                  <td className="px-2"><span className={`chip ${deliveryStatusTone(d.status)}`}>{DELIVERY_STATUS_LABELS[d.status]}</span></td>
                  <td className="px-2 text-xs text-muted-foreground">{d.details.eta || d.details.delivery_date || d.details.pickup_date || "—"}</td>
                  <td className="px-2 text-xs">
                    {d.details.tracking_link ? (
                      <a href={d.details.tracking_link} target="_blank" rel="noreferrer" className="text-primary font-semibold">{d.details.tracking_number || "Track"}</a>
                    ) : d.details.tracking_number || "—"}
                  </td>
                  <td className="px-4 text-right">
                    <Link to="/orders/$id" params={{ id }} className="text-primary text-xs font-semibold">View →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
