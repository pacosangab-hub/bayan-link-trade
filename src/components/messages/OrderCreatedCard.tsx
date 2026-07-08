// In-chat order-created card.
import { Link } from "@tanstack/react-router";
import { Package, ArrowRight, ShieldCheck } from "lucide-react";
import { useDemoOrder, formatPhp } from "@/lib/cart";
import { supplierById } from "@/lib/mock-data";

export function OrderCreatedCard({ orderId }: { orderId: string }) {
  const order = useDemoOrder(orderId);
  if (!order) {
    return (
      <div className="rounded-lg border-2 border-success/40 bg-success/5 p-3 max-w-sm text-xs">
        Order <span className="font-mono">{orderId.toUpperCase()}</span> created.
        <Link to="/orders/$id" params={{ id: orderId }} className="text-primary font-semibold ml-1">View →</Link>
      </div>
    );
  }
  const sup = supplierById(order.supplierId);
  return (
    <div className="rounded-lg border-2 border-success/40 bg-card p-3 max-w-sm shadow-sm">
      <div className="text-[10px] uppercase tracking-widest text-success font-bold inline-flex items-center gap-1 mb-2">
        <Package size={11} /> Order Created
      </div>
      <div className="font-semibold text-sm">{order.id.toUpperCase()}</div>
      <div className="text-[11px] text-muted-foreground">{sup?.name}</div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-[10px] uppercase text-muted-foreground">Total</span>
        <span className="font-display text-lg text-primary">{formatPhp(order.totalPhp)}</span>
      </div>
      <div className="text-[11px] text-success flex items-center gap-1 mt-1">
        <ShieldCheck size={11} /> {order.escrowState}
      </div>
      <Link to="/orders/$id" params={{ id: order.id }} className="mt-3 w-full text-center bg-primary text-primary-foreground text-xs font-semibold rounded-md py-2 flex items-center justify-center gap-1.5 hover:bg-primary/90">
        View Order <ArrowRight size={12} />
      </Link>
    </div>
  );
}
