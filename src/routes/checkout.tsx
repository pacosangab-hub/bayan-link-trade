import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import {
  useCart, removeFromCart, updateCartQty, clearCart,
  shippingTable, type ShippingDest, tierPriceFor, escrowOrder, saveDemoOrder,
} from "@/lib/cart";
import { productById, supplierById, formatPhp } from "@/lib/mock-data";
import { ShieldCheck, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — PSG" }] }),
  component: CheckoutPage,
});

const PAYMENTS = [
  { id: "escrow", label: "PSG Escrow (Recommended)", desc: "Funds held until delivery confirmed", icon: "🛡️", disabled: false },
  { id: "gcash", label: "GCash", desc: "Pay via GCash wallet", icon: "💚", disabled: false },
  { id: "maya", label: "Maya", desc: "Pay via Maya wallet", icon: "💙", disabled: false },
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, JCB", icon: "💳", disabled: false },
  { id: "bank", label: "Bank Transfer", desc: "BPI, BDO, Metrobank, UnionBank", icon: "🏦", disabled: false },
  { id: "cod", label: "Cash on Delivery", desc: "Unavailable for B2B escrow orders", icon: "💵", disabled: true },
];

function defaultDeliveryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString().slice(0, 10);
}

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [dest, setDest] = useState<ShippingDest>("Metro Manila");
  const [payment, setPayment] = useState("escrow");
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>(defaultDeliveryDate());

  const [addr, setAddr] = useState({
    business: "Lola Nena's Carinderia Group",
    contact: "Maria Reyes",
    phone: "+63 917 555 0142",
    address: "14 Roces Ave, Project 8, Quezon City, Metro Manila",
    instructions: "Deliver to commissary side gate. Call upon arrival.",
  });

  const lines = cart.map((c) => {
    const p = productById(c.productId);
    const price = tierPriceFor(c.productId, c.qty);
    return { ...c, product: p, price, total: price * c.qty };
  });
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  const ship = shippingTable[dest];
  const escrowFee = cart.length ? Math.round(subtotal * 0.03) : 0;
  const total = subtotal + (cart.length ? ship.cost : 0) + escrowFee;

  function handlePay() {
    if (!cart.length) return;
    setProcessing(true);
    setTimeout(() => {
      const o = escrowOrder({
        items: cart.map((c) => ({ productId: c.productId, qty: c.qty })),
        shippingDest: dest,
        payment,
        address: addr,
      });
      saveDemoOrder(o);
      clearCart();
      setProcessing(false);
      setConfirmed(o.id);
    }, 1600);
  }

  if (confirmed) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="size-20 rounded-full bg-success/10 text-success grid place-items-center mx-auto mb-4 animate-scale-in">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="font-display text-4xl">Payment secured in escrow</h1>
          <p className="text-muted-foreground mt-2">
            Order <span className="font-mono font-semibold text-foreground">{confirmed.toUpperCase()}</span> is locked into PSG escrow.
            Funds will release to the supplier once you confirm delivery.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/orders/$id", params: { id: confirmed } })}
              className="bg-primary text-white font-semibold rounded-md px-6 py-3"
            >
              Track your order →
            </button>
            <Link to="/products" className="border rounded-md px-6 py-3 font-semibold">
              Continue shopping
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!cart.length) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2">Browse the marketplace to add products.</p>
          <Link to="/products" className="mt-6 inline-block bg-primary text-white font-semibold rounded-md px-5 py-3">
            Browse products
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="font-display text-3xl">Checkout</h1>
          <p className="text-sm text-muted-foreground">{lines.length} item{lines.length > 1 ? "s" : ""} · escrow-protected payment</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          {/* Cart */}
          <Section title="Order summary">
            <div className="divide-y">
              {lines.map((l) => (
                <div key={l.productId} className="py-3 flex gap-3 items-start">
                  <img src={l.product.image} alt="" className="size-16 rounded object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm line-clamp-2">{l.product.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{supplierById(l.product.supplierId).name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => updateCartQty(l.productId, Math.max(l.product.moq, l.qty - 1))} className="size-7 border rounded text-sm">−</button>
                      <span className="text-sm font-medium w-12 text-center">{l.qty}</span>
                      <button onClick={() => updateCartQty(l.productId, l.qty + 1)} className="size-7 border rounded text-sm">+</button>
                      <span className="text-xs text-muted-foreground ml-2">× {formatPhp(l.price)} / {l.product.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg">{formatPhp(l.total)}</div>
                    <button
                      onClick={() => { removeFromCart(l.productId); toast.info("Removed from cart"); }}
                      className="text-xs text-muted-foreground hover:text-destructive mt-1 flex items-center gap-1 ml-auto"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Delivery */}
          <Section title="Delivery address">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Business name" value={addr.business} onChange={(v) => setAddr({ ...addr, business: v })} />
              <Field label="Contact person" value={addr.contact} onChange={(v) => setAddr({ ...addr, contact: v })} />
              <Field label="Phone number" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ship to</label>
                <select
                  value={dest}
                  onChange={(e) => setDest(e.target.value as ShippingDest)}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-card"
                >
                  {Object.keys(shippingTable).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Field label="Warehouse address" value={addr.address} onChange={(v) => setAddr({ ...addr, address: v })} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferred delivery date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  min={defaultDeliveryDate()}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-card"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Special instructions</label>
                <textarea
                  value={addr.instructions}
                  onChange={(e) => setAddr({ ...addr, instructions: e.target.value })}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-card min-h-[72px]"
                />
              </div>
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment method">
            <div className="rounded-md bg-success/5 border border-success/30 text-success px-3 py-2 text-xs flex items-start gap-2 mb-3">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              <span><strong>Escrow protection:</strong> Payment is held safely by PSG until you confirm delivery. If anything goes wrong, you can open a dispute within 72 hours.</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {PAYMENTS.map((m) => {
                const isDisabled = m.disabled;
                const active = payment === m.id;
                return (
                  <label
                    key={m.id}
                    className={`flex gap-3 items-start p-3 border-2 rounded-md ${isDisabled ? "opacity-50 cursor-not-allowed bg-muted/40 border-dashed" : `cursor-pointer ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      checked={active}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && setPayment(m.id)}
                      className="mt-1 accent-[oklch(0.58_0.22_27)]"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span className="text-base">{m.icon}</span>{m.label}
                        {isDisabled && <span className="text-[10px] uppercase bg-muted px-1.5 py-0.5 rounded ml-1">Disabled</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Sticky summary */}
        <aside className="lg:sticky lg:top-32 self-start">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Payment summary</div>
            <div className="space-y-1.5 text-sm">
              <Row label={`Subtotal (${lines.reduce((n, l) => n + l.qty, 0)} items)`} value={formatPhp(subtotal)} />
              <Row label={`Shipping — ${dest}`} value={formatPhp(ship.cost)} />
              <Row label="Escrow / platform fee (3%)" value={formatPhp(escrowFee)} sub />
              <Row label={`Preferred delivery — ${deliveryDate}`} value="" sub />
            </div>
            <div className="border-t my-3" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-3xl text-primary">{formatPhp(total)}</span>
            </div>
            <button
              onClick={handlePay}
              disabled={processing}
              className="mt-5 w-full bg-primary text-primary-foreground font-semibold rounded-md py-3 hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {processing ? (<><Loader2 size={18} className="animate-spin" /> Processing payment…</>) : (<><ShieldCheck size={16} /> Pay Securely</>)}
            </button>
            <div className="mt-3 flex items-start gap-2 text-xs text-success">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              <span>For demo only — no real payment. Funds simulate into PSG escrow and release after you confirm delivery.</span>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="px-5 py-3 border-b font-semibold">{title}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-card"
      />
    </div>
  );
}
function Row({ label, value, sub }: { label: string; value: string; sub?: boolean }) {
  return (
    <div className={`flex justify-between ${sub ? "text-muted-foreground text-xs" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
