import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { toast } from "sonner";
import { useAllRfqs, saveRfq, newRfqId } from "@/lib/rfq-store";
import { DELIVERY_METHOD_LIST, deliveryLabel, type DeliveryMethodKey } from "@/lib/delivery";
import { supplierById, formatPhp } from "@/lib/mock-data";
import type { RFQ } from "@/lib/mock-data";
import {
  Send, ClipboardList, PackageCheck, HelpCircle, Sparkles, Check, ArrowRight,
  ShieldCheck, Star, Zap, Award, MessageSquare, XCircle, Edit3,
} from "lucide-react";

export const Route = createFileRoute("/rfq-center")({
  head: () => ({ meta: [{ title: "Get Supplier Quotes — PSG" }] }),
  component: RfqCenter,
});

type Tab = "post" | "requests" | "offers" | "how";

const CATEGORY_CHIPS = [
  "Packaging", "Rice & Grains", "Coffee & Café Supplies", "Meat & Frozen Food",
  "Cooking Oil", "Sauces & Condiments", "Beverages", "Cleaning Supplies",
  "Bakery Ingredients", "Fresh Produce", "Restaurant Supplies", "Other",
];

const TEMPLATES = [
  { key: "restaurant", label: "Restaurant Supplies", example: "Rice, cooking oil, sauces, cleaning supplies", category: "Restaurant Supplies", product: "Weekly restaurant supplies bundle" },
  { key: "cafe", label: "Café Supplies", example: "Coffee beans, syrups, milk, cups, lids", category: "Coffee & Café Supplies", product: "Café supplies restock" },
  { key: "packaging", label: "Packaging Request", example: "Takeout boxes, cups, bottles, labels, pouches", category: "Packaging", product: "5,000 kraft takeout boxes" },
  { key: "frozen", label: "Frozen Food Request", example: "Frozen meat, siomai, fries, burger patties", category: "Meat & Frozen Food", product: "Frozen food monthly restock" },
  { key: "custom-pack", label: "Custom Packaging", example: "Logo printed boxes, stickers, bottles, pouches", category: "Packaging", product: "Custom logo-printed packaging" },
];

function RfqCenter() {
  const [tab, setTab] = useState<Tab>("post");

  return (
    <AppShell>
      <div className="gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/85">RFQ Center</div>
          <h1 className="font-display text-4xl mt-1">Get Supplier Quotes</h1>
          <p className="text-white/90 mt-2 max-w-2xl">
            Post what your business needs and receive offers from verified suppliers.
          </p>
          <p className="text-white/95 mt-1 font-semibold">Post what you need once. Suppliers send offers.</p>

          <div className="mt-6 grid md:grid-cols-3 gap-3">
            {[
              { n: 1, t: "Tell us what you need", d: "Product, quantity, location, deadline." },
              { n: 2, t: "Suppliers send offers", d: "Price, MOQ, delivery, payment terms." },
              { n: 3, t: "Compare, accept, order", d: "Pick the best and create a protected order." },
            ].map((s) => (
              <div key={s.n} className="rounded-lg bg-white/10 border border-white/20 p-4">
                <div className="text-[10px] uppercase font-bold text-white/80">Step {s.n}</div>
                <div className="font-semibold mt-1">{s.t}</div>
                <div className="text-sm text-white/80 mt-1">{s.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setTab("post")} className="inline-flex items-center gap-2 bg-white text-primary font-semibold rounded-md px-4 py-2.5 text-sm">
              <Send size={16} /> Post Quote Request
            </button>
            <button onClick={() => setTab("requests")} className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white font-semibold rounded-md px-4 py-2.5 text-sm">
              <ClipboardList size={16} /> View My Requests
            </button>
          </div>
          <p className="text-xs text-white/80 mt-3 max-w-2xl">
            Use quote requests when you need bulk pricing, custom quantities, delivery options, or supplier recommendations.
          </p>
        </div>
      </div>

      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 flex gap-1 overflow-x-auto text-sm">
          {[
            { k: "post", l: "Post Request", i: Send },
            { k: "requests", l: "My Requests", i: ClipboardList },
            { k: "offers", l: "Supplier Offers", i: PackageCheck },
            { k: "how", l: "How It Works", i: HelpCircle },
          ].map(({ k, l, i: Icon }) => (
            <button key={k} onClick={() => setTab(k as Tab)}
              className={`inline-flex items-center gap-1.5 px-3 py-3 whitespace-nowrap font-medium border-b-2 transition-colors ${tab === k ? "border-primary text-primary" : "border-transparent text-foreground/70 hover:text-foreground"}`}>
              <Icon size={14} /> {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {tab === "post" && <PostRequestTab onPosted={() => setTab("requests")} />}
        {tab === "requests" && <MyRequestsTab onPost={() => setTab("post")} onOffers={() => setTab("offers")} />}
        {tab === "offers" && <SupplierOffersTab />}
        {tab === "how" && <HowItWorksTab onPost={() => setTab("post")} />}
      </div>
    </AppShell>
  );
}

// ---------------- Post Request ----------------
function PostRequestTab({ onPosted }: { onPosted: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    product: "",
    category: "",
    quantity: "",
    unit: "pcs",
    specifications: "",
    deliveryLocation: "",
    neededBy: "",
    deliveryMethod: "" as DeliveryMethodKey | "recommend" | "",
    deliveryNotes: "",
    budget: "",
    invoiceRequired: "Yes",
    supplierLocation: "",
    recurring: "One-time",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setForm((f) => ({
      ...f,
      product: t.product,
      category: t.category,
      specifications: t.example,
    }));
    toast.success(`Loaded template: ${t.label}`);
  }

  function submit() {
    const id = newRfqId();
    const rfq: RFQ = {
      id,
      buyer: "Lola Nena's Carinderia Group",
      buyerType: "Restaurant Group",
      buyerVerified: true,
      title: form.product || "Untitled quote request",
      category: form.category || "Other",
      qty: form.quantity || "—",
      unit: form.unit,
      recurring: form.recurring !== "One-time",
      budgetPhp: form.budget || "Open to offers",
      deliverBy: form.neededBy || "Flexible",
      deliveryLocation: form.deliveryLocation,
      region: "NCR",
      postedAgo: "just now",
      description: `${form.specifications}\n\nPreferred delivery: ${form.deliveryMethod === "recommend" ? "Open to supplier recommendation" : deliveryLabel(form.deliveryMethod)}${form.deliveryNotes ? `\nNotes: ${form.deliveryNotes}` : ""}\nInvoice: ${form.invoiceRequired}\nRecurring: ${form.recurring}`,
      responses: 0,
      status: "Open",
      quotes: [],
      nextAction: "Waiting for supplier offers",
    };
    saveRfq(rfq);
    toast.success("Your quote request has been posted. Relevant suppliers can now send offers.");
    onPosted();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl">What do you need?</h2>
          <p className="text-sm text-muted-foreground">Fill in the details. Suppliers respond within hours.</p>
        </div>

        <StepIndicator step={step} labels={["Product", "Delivery", "Budget", "Review"]} />

        {step === 1 && (
          <SectionCard title="Product Needed">
            <Field label="Product or item name">
              <input value={form.product} onChange={(e) => set("product", e.target.value)}
                placeholder="e.g. 5,000 16oz PET cups with flat lids"
                className="w-full border rounded-md px-3 py-2 bg-background" />
            </Field>
            <Field label="Category">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_CHIPS.map((c) => (
                  <button key={c} onClick={() => set("category", c)}
                    className={`px-3 py-1.5 rounded-full text-xs border ${form.category === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Quantity">
                <input value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="e.g. 5000"
                  className="w-full border rounded-md px-3 py-2 bg-background" />
              </Field>
              <Field label="Unit">
                <select value={form.unit} onChange={(e) => set("unit", e.target.value)} className="w-full border rounded-md px-3 py-2 bg-background">
                  {["pcs", "kg", "sacks", "boxes", "liters", "cases", "packs", "rolls"].map((u) => <option key={u}>{u}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Product details or specifications">
              <textarea value={form.specifications} onChange={(e) => set("specifications", e.target.value)}
                rows={3} placeholder="Sizes, materials, printing, packaging, quality grade…"
                className="w-full border rounded-md px-3 py-2 bg-background" />
            </Field>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard title="Delivery Details">
            <Field label="Delivery location">
              <input value={form.deliveryLocation} onChange={(e) => set("deliveryLocation", e.target.value)}
                placeholder="City, address, or landmark"
                className="w-full border rounded-md px-3 py-2 bg-background" />
            </Field>
            <Field label="Needed by">
              <input type="date" value={form.neededBy} onChange={(e) => set("neededBy", e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background" />
            </Field>
            <Field label="Preferred delivery method">
              <div className="grid gap-2">
                {DELIVERY_METHOD_LIST.map((m) => (
                  <label key={m.key} className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer ${form.deliveryMethod === m.key ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
                    <input type="radio" name="dm" checked={form.deliveryMethod === m.key} onChange={() => set("deliveryMethod", m.key)} className="mt-1" />
                    <div>
                      <div className="font-semibold text-sm">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.description}</div>
                    </div>
                  </label>
                ))}
                <label className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer ${form.deliveryMethod === "recommend" ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
                  <input type="radio" name="dm" checked={form.deliveryMethod === "recommend"} onChange={() => set("deliveryMethod", "recommend")} className="mt-1" />
                  <div>
                    <div className="font-semibold text-sm">Open to Supplier Recommendation</div>
                    <div className="text-xs text-muted-foreground">Let the supplier suggest the best option.</div>
                  </div>
                </label>
              </div>
            </Field>
            <Field label="Special delivery instructions">
              <textarea value={form.deliveryNotes} onChange={(e) => set("deliveryNotes", e.target.value)} rows={2}
                placeholder="Loading dock hours, contact person, access notes…"
                className="w-full border rounded-md px-3 py-2 bg-background" />
            </Field>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard title="Budget & Requirements">
            <Field label="Target budget (optional)">
              <input value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. ₱4.00–₱4.50 per pc"
                className="w-full border rounded-md px-3 py-2 bg-background" />
            </Field>
            <Field label="Invoice required?">
              <div className="flex gap-2">
                {["Yes", "No", "Depends"].map((v) => (
                  <button key={v} onClick={() => set("invoiceRequired", v)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${form.invoiceRequired === v ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Preferred supplier location (optional)">
              <input value={form.supplierLocation} onChange={(e) => set("supplierLocation", e.target.value)} placeholder="e.g. NCR, Bulacan, Cavite"
                className="w-full border rounded-md px-3 py-2 bg-background" />
            </Field>
            <Field label="Recurring purchase?">
              <select value={form.recurring} onChange={(e) => set("recurring", e.target.value)} className="w-full border rounded-md px-3 py-2 bg-background">
                {["One-time", "Weekly", "Every 2 weeks", "Monthly", "As needed"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
          </SectionCard>
        )}

        {step === 4 && (
          <SectionCard title="Review Request">
            <ReviewRow label="Product" value={form.product} />
            <ReviewRow label="Category" value={form.category} />
            <ReviewRow label="Quantity" value={`${form.quantity} ${form.unit}`} />
            <ReviewRow label="Location" value={form.deliveryLocation || "—"} />
            <ReviewRow label="Needed by" value={form.neededBy || "Flexible"} />
            <ReviewRow label="Delivery preference" value={form.deliveryMethod === "recommend" ? "Open to supplier recommendation" : deliveryLabel(form.deliveryMethod)} />
            <ReviewRow label="Budget" value={form.budget || "Open to offers"} />
            <ReviewRow label="Invoice" value={form.invoiceRequired} />
            <ReviewRow label="Recurring" value={form.recurring} />
          </SectionCard>
        )}

        <div className="flex justify-between">
          <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
            className="border rounded-md px-4 py-2 text-sm disabled:opacity-40">Back</button>
          {step < 4 ? (
            <button onClick={() => setStep((s) => s + 1)}
              className="bg-primary text-primary-foreground rounded-md px-5 py-2 text-sm font-semibold inline-flex items-center gap-1">
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={submit}
              className="bg-primary text-primary-foreground rounded-md px-5 py-2 text-sm font-semibold inline-flex items-center gap-1">
              <Check size={14} /> Post Quote Request
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-primary" />
            <div className="font-semibold text-sm">Quick-start templates</div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Prefill the form with a common request.</p>
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <button key={t.key} onClick={() => applyTemplate(t)}
                className="w-full text-left border rounded-md p-3 hover:border-primary hover:bg-primary/5 transition-colors">
                <div className="font-semibold text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.example}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-5 space-y-4 bg-card">
      <div className="font-semibold">{title}</div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b last:border-b-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={l} className="flex items-center gap-2">
            <div className={`size-7 rounded-full grid place-items-center text-xs font-bold ${active ? "bg-primary text-primary-foreground" : done ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>
              {done ? <Check size={14} /> : n}
            </div>
            <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
            {i < labels.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

// ---------------- My Requests ----------------
function MyRequestsTab({ onPost, onOffers }: { onPost: () => void; onOffers: () => void }) {
  const rfqs = useAllRfqs();
  if (!rfqs.length) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <ClipboardList className="mx-auto text-muted-foreground" size={36} />
        <div className="font-display text-xl mt-3">No quote requests yet.</div>
        <p className="text-sm text-muted-foreground mt-1">Post your first request and suppliers can send you offers.</p>
        <button onClick={onPost} className="mt-4 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">
          Post Quote Request
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-display text-xl">My Requests</h2>
        <button onClick={onPost} className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-semibold">
          + Post Request
        </button>
      </div>
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left p-3">Request</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Qty</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Offers</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-semibold text-sm">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.postedAgo}</div>
                  </td>
                  <td className="p-3 text-xs">{r.category}</td>
                  <td className="p-3 text-xs">{r.qty} {r.unit || ""}</td>
                  <td className="p-3 text-xs">{r.deliveryLocation || r.region}</td>
                  <td className="p-3 text-sm font-semibold">{r.responses || r.quotes.length}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{r.status}</span></td>
                  <td className="p-3">
                    <button onClick={onOffers} className="text-primary text-xs font-semibold hover:underline">
                      View Offers →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------- Supplier Offers ----------------
function SupplierOffersTab() {
  const rfqs = useAllRfqs();
  const navigate = useNavigate();
  const offers = rfqs.flatMap((r) =>
    r.quotes.map((q, i) => ({ rfq: r, q, key: `${r.id}-${i}` }))
  );

  if (!offers.length) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <PackageCheck className="mx-auto text-muted-foreground" size={36} />
        <div className="font-display text-xl mt-3">No offers yet</div>
        <p className="text-sm text-muted-foreground mt-1">Suppliers will send offers once your requests are posted.</p>
      </div>
    );
  }

  // Highlights
  const bestPrice = offers.reduce((min, o) => (o.q.pricePhp < min.q.pricePhp ? o : min), offers[0]);
  const fastest = offers.reduce((f, o) => (o.q.leadTimeDays < f.q.leadTimeDays ? o : f), offers[0]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl">Supplier Offers</h2>
        <p className="text-sm text-muted-foreground">Compare offers side-by-side and accept the best fit.</p>
      </div>

      <div className="grid gap-4">
        {offers.map(({ rfq, q, key }) => {
          const s = supplierById(q.supplierId);
          const total = q.pricePhp * Number(rfq.qty || 1) + (q.deliveryFee || 0);
          const highlights: string[] = [];
          if (key === bestPrice.key) highlights.push("Best price");
          if (key === fastest.key) highlights.push("Fastest delivery");
          if (s.verified) highlights.push("Verified supplier");
          return (
            <div key={key} className="border rounded-lg p-4 bg-card">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-muted-foreground">For: {rfq.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="font-display text-lg">{s.name}</div>
                    {s.verified && <ShieldCheck size={16} className="text-success" />}
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star size={12} className="fill-gold text-gold" /> {s.rating}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{s.location}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {highlights.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded bg-success/10 text-success">
                      <Award size={10} /> {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                <Metric label="Unit Price" value={formatPhp(q.pricePhp)} />
                <Metric label="MOQ" value={`${q.moq} ${rfq.unit || "units"}`} />
                <Metric label="Delivery Fee" value={q.deliveryFee ? formatPhp(q.deliveryFee) : "Free"} />
                <Metric label="Lead Time" value={`${q.leadTimeDays} day${q.leadTimeDays !== 1 ? "s" : ""}`} />
                <Metric label="Total" value={formatPhp(total)} />
                <Metric label="Delivery Method" value={deliveryLabel("supplier_owned_logistics")} />
                <Metric label="Invoice" value="Available" />
                <Metric label="Protected Payment" value="Yes" />
              </div>

              {q.note && <p className="text-sm text-muted-foreground mt-3 italic">"{q.note}"</p>}

              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={() => navigate({ to: "/rfq/$id", params: { id: rfq.id } })}
                  className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">
                  Accept Offer
                </button>
                <button className="border rounded-md px-3 py-2 text-sm inline-flex items-center gap-1">
                  <Edit3 size={14} /> Request Changes
                </button>
                <button className="border rounded-md px-3 py-2 text-sm inline-flex items-center gap-1">
                  <XCircle size={14} /> Decline
                </button>
                <Link to="/messages" className="border rounded-md px-3 py-2 text-sm inline-flex items-center gap-1">
                  <MessageSquare size={14} /> Message Supplier
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

// ---------------- How It Works ----------------
function HowItWorksTab({ onPost }: { onPost: () => void }) {
  const steps = [
    { t: "Post what you need", d: "Tell suppliers the product, quantity, location, and deadline." },
    { t: "Receive supplier offers", d: "Suppliers send price, MOQ, delivery, and payment terms." },
    { t: "Compare offers", d: "Check price, delivery time, invoice, supplier rating, and payment protection." },
    { t: "Accept an offer", d: "Once accepted, PSG creates an order." },
    { t: "Track delivery and confirm", d: "Choose pickup, third-party carrier, or supplier delivery. Confirm once received." },
  ];
  const examples = [
    "Need 5,000 takeout boxes by Friday in Makati.",
    "Need 30 sacks of rice delivered to Quezon City.",
    "Need coffee beans, cups, lids, and syrups for a café.",
  ];
  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div>
        <h2 className="font-display text-2xl">How quote requests work</h2>
        <div className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="border rounded-lg p-4 flex gap-4">
              <div className="size-9 rounded-full bg-primary text-primary-foreground font-bold grid place-items-center">{i + 1}</div>
              <div>
                <div className="font-semibold">{s.t}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onPost} className="mt-6 bg-primary text-primary-foreground rounded-md px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-1">
          <Send size={14} /> Post Quote Request
        </button>
      </div>
      <aside className="border rounded-lg p-4 bg-card h-fit">
        <div className="flex items-center gap-2 mb-2"><Zap size={16} className="text-primary" /><div className="font-semibold text-sm">Real buyer examples</div></div>
        <ul className="space-y-2 text-sm">
          {examples.map((e, i) => (<li key={i} className="border-l-2 border-primary pl-3 text-muted-foreground italic">{e}</li>))}
        </ul>
      </aside>
    </div>
  );
}
