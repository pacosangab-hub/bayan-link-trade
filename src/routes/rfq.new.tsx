import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { categories, regions } from "@/lib/mock-data";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/rfq/new")({
  head: () => ({ meta: [{ title: "Post an RFQ — PSG" }] }),
  component: NewRFQ,
});

function NewRFQ() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="size-16 mx-auto rounded-full bg-success/15 text-success grid place-items-center">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="font-display text-4xl mt-5">Your RFQ is live!</h1>
          <p className="text-muted-foreground mt-2">
            Verified suppliers in the matched category are being notified. Expect first quotes within 2–6 hours.
          </p>
          <div className="mt-6 flex gap-2 justify-center">
            <Link to="/rfq" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-semibold">View RFQ marketplace</Link>
            <Link to="/dashboard/buyer" className="border px-5 py-2.5 rounded-md font-semibold">Buyer dashboard</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/rfq" className="text-xs text-muted-foreground hover:text-primary">← Back to RFQ Marketplace</Link>
        <h1 className="font-display text-4xl mt-2">Post a Request for Quotation</h1>
        <p className="text-muted-foreground mt-1">
          Tell suppliers what you need. They'll send competing quotes you can compare side-by-side.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
          className="mt-8 space-y-6 bg-card border rounded-lg p-6"
        >
          <Field label="What are you sourcing?" hint="A concise title suppliers will see in the feed.">
            <input className="input" placeholder="e.g. 500 kg/month premium rice — recurring" required defaultValue="500 kg/month premium rice — recurring" />
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Category">
              <select className="input" required>
                {categories.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Region">
              <select className="input" required>
                {regions.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Quantity">
              <input className="input" placeholder="e.g. 500 kg / month" defaultValue="500 kg / month" />
            </Field>
            <Field label="Budget (optional)">
              <input className="input" placeholder="₱45–50 / kg" defaultValue="₱45–50 / kg" />
            </Field>
            <Field label="Need by">
              <input className="input" type="date" defaultValue="2026-07-15" />
            </Field>
          </div>

          <Field label="Details" hint="Quality, specs, delivery preferences, contract length.">
            <textarea className="input min-h-[140px]" placeholder="Tell suppliers what matters: grade, packaging, delivery cadence, payment terms..." defaultValue="We operate 8 branches in QC and Caloocan. Need consistent quality, weekly delivery to a central commissary in Project 8. Open to 6-month contract." />
          </Field>

          <Field label="Attachments (optional)">
            <div className="border-2 border-dashed rounded-md p-6 text-center text-sm text-muted-foreground">
              Drag spec sheets, sample images, or contracts here
            </div>
          </Field>

          <div className="flex items-center justify-between gap-4 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              By posting, you agree to PSG's RFQ guidelines and quote-handling policy.
            </div>
            <button type="submit" className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-md">
              Publish RFQ
            </button>
          </div>
        </form>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-input);border-radius:.5rem;padding:.6rem .75rem;background:var(--color-background);font-size:.875rem}.input:focus{outline:2px solid var(--color-primary);outline-offset:0}`}</style>
    </AppShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{label}</div>
      {hint && <div className="text-xs text-muted-foreground mb-1.5">{hint}</div>}
      {children}
    </label>
  );
}
