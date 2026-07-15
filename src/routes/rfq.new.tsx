import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { categories, regions } from "@/lib/mock-data";
import { newRfqId, saveRfq } from "@/lib/rfq-store";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/rfq/new")({
  head: () => ({ meta: [{ title: "Post a Quote Request — PSG" }] }),
  component: NewRFQ,
});

const CERT_OPTIONS = ["DTI", "BIR", "FDA", "BFAR", "HACCP", "ISO", "NMIS", "DA"];
const DELIVERY_PREF_OPTIONS = [
  "Pick Up at Warehouse",
  "Third-Party Carrier with Tracking",
  "Supplier-Owned Logistics",
  "Open to Supplier Recommendation",
];

function NewRFQ() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    product: "500 kg/month Premium Rice — Recurring Supply",
    category: "Rice & Grains",
    qty: "500",
    unit: "kg",
    recurring: true,
    budget: "₱45–50 / kg",
    deliveryLocation: "Project 8 Commissary, Quezon City",
    region: "NCR",
    neededBy: "2026-07-15",
    schedule: "Weekly, Monday 6 AM",
    verifiedOnly: true,
    certs: ["DTI", "BIR"] as string[],
    notes: "Consistent grade preferred. Open to 6-month contract.",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleCert(c: string) {
    setForm((f) => ({ ...f, certs: f.certs.includes(c) ? f.certs.filter((x) => x !== c) : [...f.certs, c] }));
  }

  function submit() {
    const id = newRfqId();
    saveRfq({
      id,
      buyer: "Lola Nena's Carinderia Group",
      buyerType: "Buyer",
      buyerVerified: true,
      title: form.product,
      category: form.category,
      qty: `${form.qty} ${form.unit}${form.recurring ? " (recurring)" : ""}`,
      unit: form.unit,
      recurring: form.recurring,
      budgetPhp: form.budget || "Open",
      deliverBy: form.neededBy,
      deliveryLocation: form.deliveryLocation,
      region: form.region,
      postedAgo: "just now",
      description: `${form.notes}${form.certs.length ? `\n\nRequired certifications: ${form.certs.join(", ")}` : ""}${form.verifiedOnly ? "\nVerified suppliers only." : ""}`,
      responses: 0,
      status: "Open",
      nextAction: "No quotes yet — Share request",
      quotes: [],
    });
    toast.success("Your quote request is live. Verified suppliers can now submit offers.");
    navigate({ to: "/rfq/$id", params: { id } });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/rfq" className="text-xs text-muted-foreground hover:text-primary">← Back to Get Supplier Quotes</Link>
        <h1 className="font-display text-4xl mt-2">Post a Quote Request</h1>
        <p className="text-muted-foreground mt-1">Tell verified suppliers what you need. It only takes a minute.</p>

        {/* Progress */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`size-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${step > n ? "bg-success text-white" : step === n ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                {step > n ? <Check size={14} /> : n}
              </div>
              <div className={`text-xs font-medium truncate ${step >= n ? "text-foreground" : "text-muted-foreground"}`}>
                {["What you need", "Budget & delivery", "Requirements", "Review"][n - 1]}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-card border rounded-lg p-6 space-y-5">
          {step === 1 && (
            <>
              <Field label="What are you sourcing?">
                <input className="input" value={form.product} onChange={(e) => set("product", e.target.value)} />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Category">
                  <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {categories.map((c) => <option key={c.name}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Order type">
                  <select className="input" value={form.recurring ? "recurring" : "one-time"} onChange={(e) => set("recurring", e.target.value === "recurring")}>
                    <option value="one-time">One-time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </Field>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Quantity">
                  <input className="input" value={form.qty} onChange={(e) => set("qty", e.target.value)} placeholder="500" />
                </Field>
                <Field label="Unit">
                  <input className="input" value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="kg / pcs / sack / carton" />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Target budget (optional)">
                <input className="input" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="₱45–50 / kg" />
              </Field>
              <Field label="Delivery location">
                <input className="input" value={form.deliveryLocation} onChange={(e) => set("deliveryLocation", e.target.value)} />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Region">
                  <select className="input" value={form.region} onChange={(e) => set("region", e.target.value)}>
                    {regions.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Needed by">
                  <input type="date" className="input" value={form.neededBy} onChange={(e) => set("neededBy", e.target.value)} />
                </Field>
              </div>
              <Field label="Preferred delivery schedule">
                <input className="input" value={form.schedule} onChange={(e) => set("schedule", e.target.value)} placeholder="e.g. Weekly, Monday 6 AM" />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <label className="flex items-center gap-3 p-3 border rounded-md">
                <input type="checkbox" checked={form.verifiedOnly} onChange={(e) => set("verifiedOnly", e.target.checked)} />
                <div>
                  <div className="text-sm font-semibold">Verified suppliers only</div>
                  <div className="text-xs text-muted-foreground">Only KYC-verified PSG suppliers will see this request.</div>
                </div>
              </label>
              <Field label="Required certifications / documents">
                <div className="flex flex-wrap gap-2">
                  {CERT_OPTIONS.map((c) => {
                    const on = form.certs.includes(c);
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleCert(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Notes / specifications">
                <textarea className="input min-h-[120px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Review your quote request before posting.</div>
              <div className="rounded-md bg-muted/50 border p-4 space-y-2 text-sm">
                <Line k="Product" v={form.product} />
                <Line k="Category" v={form.category} />
                <Line k="Quantity" v={`${form.qty} ${form.unit}${form.recurring ? " (recurring)" : ""}`} />
                <Line k="Budget" v={form.budget || "Open"} />
                <Line k="Delivery" v={`${form.deliveryLocation} · ${form.region}`} />
                <Line k="Needed by" v={form.neededBy} />
                <Line k="Schedule" v={form.schedule} />
                <Line k="Requirements" v={`${form.verifiedOnly ? "Verified only · " : ""}${form.certs.join(", ") || "—"}`} />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="inline-flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-md border disabled:opacity-40"
            >
              <ArrowLeft size={14} /> Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1 bg-primary text-primary-foreground font-semibold px-5 py-2 rounded-md"
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-md"
              >
                Post Request <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-input);border-radius:.5rem;padding:.6rem .75rem;background:var(--color-background);font-size:.875rem}.input:focus{outline:2px solid var(--color-primary);outline-offset:0}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
