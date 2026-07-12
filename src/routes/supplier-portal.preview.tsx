import { createFileRoute, Link } from "@tanstack/react-router";
import { suppliers, products, formatPhp } from "@/lib/mock-data";
import { useSupplierListings } from "@/lib/supplier-listings";
import { useInventoryMap, getInventory, computeStatus, badgeForStatus } from "@/lib/inventory";
import {
  MapPin, Clock, Truck, ShieldCheck, Award, Zap, Star, Eye, Pencil,
  MessageSquare, FileText, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/supplier-portal/preview")({
  head: () => ({ meta: [{ title: "Public Preview — Supplier Portal" }] }),
  component: PublicPreviewPage,
});

const SUP_ID = "sup_001";

function PublicPreviewPage() {
  const supplier = suppliers.find((s) => s.id === SUP_ID)!;
  const listings = useSupplierListings();
  useInventoryMap();

  const catalog = [
    ...products.filter((p) => p.supplierId === SUP_ID).map((p) => ({
      id: p.id, name: p.title, image: p.image, moq: p.moq, unit: p.unit,
      priceLabel: formatPhp(p.pricePhp),
      leadTime: `${p.leadTimeDays} days`,
      status: "Active" as const,
    })),
    ...listings.map((l) => ({
      id: l.id, name: l.name, image: l.images[0], moq: l.moq, unit: l.unit,
      priceLabel: l.priceType === "fixed" ? `₱${l.fixedPrice}` : l.priceType === "range" ? `₱${l.minPrice}–${l.maxPrice}` : "Request quote",
      leadTime: l.leadTime,
      status: l.status,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header + preview actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Public Supplier Profile Preview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This is how your supplier account appears to buyers. Buyer actions are disabled here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/suppliers/$id" params={{ id: SUP_ID }} target="_blank"
            className="inline-flex items-center gap-2 border bg-card px-3 py-2 rounded-md text-xs font-semibold hover:border-primary/60"
          >
            <ExternalLink size={12} /> View as Buyer
          </Link>
          <Link
            to="/supplier-portal/verification"
            className="inline-flex items-center gap-2 border bg-card px-3 py-2 rounded-md text-xs font-semibold hover:border-primary/60"
          >
            <Pencil size={12} /> Edit Public Profile
          </Link>
          <Link
            to="/supplier-portal/products"
            className="inline-flex items-center gap-2 border bg-card px-3 py-2 rounded-md text-xs font-semibold hover:border-primary/60"
          >
            <Eye size={12} /> Preview Catalog
          </Link>
        </div>
      </div>

      {/* Preview banner */}
      <div className="rounded-md border border-dashed bg-muted/40 px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <Eye size={12} /> <span className="font-semibold">Preview mode</span> · Buyer actions below are disabled.
      </div>

      {/* Profile card */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="relative h-40 md:h-48">
          <img src={supplier.cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        </div>
        <div className="p-5 md:p-6 -mt-14 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="size-20 rounded-lg bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display text-4xl shrink-0 border-4 border-card">
              {supplier.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <span className="chip chip-verified inline-flex items-center gap-1"><ShieldCheck size={11} /> Verified Supplier</span>
                <span className="chip chip-gold inline-flex items-center gap-1"><Award size={11} /> Gold Supplier</span>
                <span className="chip inline-flex items-center gap-1 bg-primary/10 text-primary"><ShieldCheck size={11} /> Escrow Ready</span>
                <span className="chip inline-flex items-center gap-1 bg-amber-100 text-amber-800"><Zap size={11} /> Fast Responder</span>
              </div>
              <h3 className="font-display text-2xl">{supplier.name}</h3>
              <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-3">
                <span>{supplier.type}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={13} /> {supplier.location}</span>
                <span className="inline-flex items-center gap-1"><Clock size={13} /> Replies {supplier.responseTime}</span>
                <span className="inline-flex items-center gap-1"><Truck size={13} /> Lead {supplier.leadTime}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <PreviewButton label="Request Quote" primary />
              <PreviewButton label="Message Supplier" icon={<MessageSquare size={13} />} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t">
            <Stat n={supplier.rating.toFixed(1)} l="Rating" />
            <Stat n={supplier.reviews.toLocaleString()} l="Reviews" />
            <Stat n={supplier.transactions.toLocaleString()} l="Completed Orders" />
            <Stat n={supplier.responseTime} l="Response Time" />
            <Stat n={`${supplier.yearsOperating} yrs`} l="Years Operating" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* About */}
          <Section title="About">
            <p className="text-sm text-muted-foreground">{supplier.description}</p>
          </Section>

          {/* Catalog */}
          <Section title={`Product Catalog (${catalog.length})`}>
            {catalog.length === 0 ? (
              <div className="text-sm text-muted-foreground">No products yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catalog.map((p) => {
                  const inv = getInventory(p.id, { unit: p.unit, supplierId: SUP_ID });
                  const status = computeStatus(inv);
                  const badge = badgeForStatus(status);
                  return (
                    <div key={p.id} className="rounded-lg border bg-card overflow-hidden flex flex-col">
                      <div className="aspect-video bg-muted overflow-hidden">
                        {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`chip text-[10px] ${badge.className}`}>{status}</span>
                          <span className="text-[10px] text-muted-foreground">{p.status}</span>
                        </div>
                        <div className="font-medium text-sm mt-2 line-clamp-2">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          MOQ: {p.moq} {p.unit} · Lead: {p.leadTime}
                        </div>
                        <div className="mt-2 text-primary font-semibold text-sm">{p.priceLabel}</div>
                        <Link
                          to="/products/$id" params={{ id: p.id }} target="_blank"
                          className="mt-3 text-xs text-primary font-semibold inline-flex items-center gap-1"
                        >
                          Preview Product <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Ratings & reviews */}
          <Section title="Ratings & Reviews">
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <MiniStat n={`${supplier.rating.toFixed(1)} / 5`} l="Average Rating" />
              <MiniStat n={supplier.reviews.toLocaleString()} l="Reviews" />
              <MiniStat n={supplier.transactions.toLocaleString()} l="Completed Orders" />
            </div>
            <div className="space-y-3">
              {SAMPLE_REVIEWS.map((r, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{r.buyer}</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: r.rating }).map((_, k) => (
                        <Star key={k} size={12} fill="currentColor" />
                      ))}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">"{r.text}"</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="space-y-4">
          <Section title="Main Categories">
            <div className="flex flex-wrap gap-1.5">
              {supplier.categories.map((c) => (
                <span key={c} className="chip chip-primary">{c}</span>
              ))}
            </div>
          </Section>

          <Section title="Service Areas">
            <ul className="text-sm space-y-1">
              {["NCR", "Bulacan", "Pampanga", "CALABARZON"].map((r) => (
                <li key={r} className="inline-flex items-center gap-1.5">
                  <MapPin size={12} className="text-muted-foreground" /> {r}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Certifications & Documents">
            <ul className="space-y-1.5">
              {supplier.permits.map((p) => (
                <li key={p} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5"><FileText size={12} /> {p}</span>
                  <span className="chip chip-verified text-[10px]">Verified</span>
                </li>
              ))}
            </ul>
          </Section>
        </aside>
      </div>
    </div>
  );
}

const SAMPLE_REVIEWS = [
  { buyer: "Sunrise Hotel Group", rating: 5, text: "Reliable rice supplier. Delivered on time and quality was consistent." },
  { buyer: "Carlo's Lechon House", rating: 5, text: "First order via escrow felt safe. Continued ever since." },
  { buyer: "Cafe Lola", rating: 4, text: "Good supplier. Communication slightly slow on Sundays." },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{l}</div>
    </div>
  );
}
function MiniStat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
      <div className="font-display text-lg mt-0.5">{n}</div>
    </div>
  );
}
function PreviewButton({ label, primary, icon }: { label: string; primary?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      title="Preview only — buyer actions are disabled here"
      className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold opacity-70 cursor-not-allowed ${
        primary ? "bg-primary text-primary-foreground" : "border bg-card"
      }`}
    >
      {icon} {label} <span className="text-[10px] font-normal opacity-80">· Preview only</span>
    </button>
  );
}
