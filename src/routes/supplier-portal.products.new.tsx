import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  isSensitive, newListingId, PLACEHOLDER_IMG, saveListing, UNIT_OPTIONS,
  type PriceType, type SupplierListing,
} from "@/lib/supplier-listings";
import { Sparkles, AlertTriangle, ChevronDown, ChevronUp, Camera, Check, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/products/new")({
  component: SimpleListingForm,
});

const CURRENT_SUPPLIER = { id: "sup_001", name: "Bulacan Grain & Rice Mills Inc.", verified: true };

type Template = {
  key: string;
  label: string;
  icon: string;
  blurb: string;
  industry: string;
  category: string;
  unit: string;
  moq: number;
  leadTime: string;
  description: string;
};

const TEMPLATES: Template[] = [
  { key: "rice", label: "Rice / Grains", icon: "🌾", blurb: "For sacks, kilos, wholesale food staples", industry: "Agriculture & Fresh Produce", category: "Rice & Grains", unit: "sack", moq: 10, leadTime: "2–3 business days", description: "Bulk rice supply for restaurants, retailers, and food service businesses." },
  { key: "boxes", label: "Packaging Boxes", icon: "📦", blurb: "For cartons, PET bottles, pouches, labels", industry: "Packaging Materials", category: "Boxes & Cartons", unit: "carton", moq: 100, leadTime: "7–14 business days", description: "Bulk packaging supply for food service, retail, and e-commerce businesses." },
  { key: "cleaning", label: "Cleaning Supplies", icon: "🧴", blurb: "Detergents, sanitizers, hygiene consumables", industry: "Cleaning & Hygiene", category: "Cleaning Solutions", unit: "gallon", moq: 12, leadTime: "2–5 business days", description: "Concentrated cleaning solutions for hotels, offices, and food service." },
  { key: "cement", label: "Construction Materials", icon: "🧱", blurb: "Cement, steel, aggregates, hardware", industry: "Construction Materials", category: "Cement", unit: "bundle", moq: 50, leadTime: "3–7 business days", description: "Construction-grade material for contractors and developers." },
  { key: "coffee", label: "Coffee Beans", icon: "☕", blurb: "Roasted, green, or ground coffee for cafés", industry: "Beverages", category: "Coffee", unit: "kg", moq: 20, leadTime: "3–5 business days", description: "Roasted coffee beans for cafés, hotels, and offices." },
  { key: "medical", label: "Medical Supplies", icon: "🩺", blurb: "PPE, consumables, devices for clinics", industry: "Medical Supplies & Devices", category: "PPE & Consumables", unit: "box", moq: 100, leadTime: "5–7 business days", description: "Medical-grade consumables for clinics, hospitals, and pharmacies." },
  { key: "hotel", label: "Hotel Supplies", icon: "🏨", blurb: "Amenities, linen, room service supplies", industry: "Hotel & Hospitality Supplies", category: "Amenities & Linen", unit: "carton", moq: 20, leadTime: "5–10 business days", description: "Hotel amenities and linen for resorts, hotels, and short-stays." },
  { key: "apparel", label: "Apparel / Uniforms", icon: "🧵", blurb: "Uniforms, workwear, corporate apparel", industry: "Textile & Garments", category: "Uniforms", unit: "piece", moq: 50, leadTime: "10–14 business days", description: "Custom uniforms and apparel for corporates, schools, and hospitality." },
  { key: "electronics", label: "Electronics", icon: "📺", blurb: "Small appliances, accessories, devices", industry: "Electronics & Appliances", category: "Small Appliances", unit: "piece", moq: 10, leadTime: "5–10 business days", description: "Electronic products for retailers, offices, and distributors." },
  { key: "custom", label: "Custom Product", icon: "✨", blurb: "Start from scratch — fill in your own details", industry: "", category: "", unit: "piece", moq: 1, leadTime: "", description: "" },
];

function autoFill(name: string): Partial<SupplierListing> {
  const n = name.toLowerCase();
  if (/rice|palay|bigas|grain/.test(n)) return {
    industry: "Agriculture & Fresh Produce", category: "Rice & Grains", unit: "sack", moq: 10,
    leadTime: "2–3 business days",
    description: `${name} suitable for restaurants, canteens, hotels, and food service buyers.`,
  };
  if (/coffee|barako|arabica|robusta/.test(n)) return {
    industry: "Beverages", category: "Coffee", unit: "kg", moq: 20, leadTime: "3–5 business days",
    description: `${name} — roasted for cafés, hotels, and offices.`,
  };
  if (/box|carton|packag/.test(n)) return {
    industry: "Packaging Materials", category: "Boxes & Cartons", unit: "carton", moq: 100, leadTime: "7–14 business days",
    description: `${name} for food service, retail, and e-commerce packing.`,
  };
  if (/detergent|soap|cleaner|bleach|sanitiz/.test(n)) return {
    industry: "Cleaning & Hygiene", category: "Cleaning Solutions", unit: "gallon", moq: 12, leadTime: "2–5 business days",
    description: `${name} for hotels, offices, and food service cleaning.`,
  };
  if (/cement|steel|gravel|sand|hollow/.test(n)) return {
    industry: "Construction Materials", category: "Cement", unit: "bundle", moq: 50, leadTime: "3–7 business days",
    description: `${name} — construction-grade for contractors and developers.`,
  };
  if (/mask|glove|ppe|syringe|bandage/.test(n)) return {
    industry: "Medical Supplies & Devices", category: "PPE & Consumables", unit: "box", moq: 100, leadTime: "5–7 business days",
    description: `${name} for clinics, hospitals, and pharmacies.`,
  };
  return {
    industry: "Food Manufacturing & FMCG", category: "General", unit: "piece", moq: 10, leadTime: "3–5 business days",
    description: `${name} — bulk supply available for wholesale buyers.`,
  };
}

function priceLabel(d: SupplierListing) {
  if (d.priceType === "quote") return "Quote on request";
  if (d.priceType === "range") {
    if (d.minPrice && d.maxPrice) return `₱${d.minPrice.toLocaleString()}–${d.maxPrice.toLocaleString()} / ${d.unit}`;
    return "Set price range";
  }
  return d.fixedPrice ? `₱${d.fixedPrice.toLocaleString()} / ${d.unit}` : "Set a price";
}

function SimpleListingForm() {
  const nav = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState<string | null>(null);
  const [data, setData] = useState<SupplierListing>({
    id: newListingId(),
    supplierId: CURRENT_SUPPLIER.id,
    supplierName: CURRENT_SUPPLIER.name,
    industry: "", category: "", subcategory: "",
    name: "", description: "", brand: "", sku: "",
    images: [PLACEHOLDER_IMG],
    unit: "piece", moq: 1,
    priceType: "fixed", fixedPrice: undefined, minPrice: undefined, maxPrice: undefined,
    bulkDiscount: false, sampleAvailable: false,
    leadTime: "", stockStatus: "In stock",
    capacity: "", regions: "", pickupLocation: "",
    deliveryAvailable: true, deliveryNotes: "",
    specification: "", certifications: "", complianceDocs: "",
    status: "Draft", createdAt: Date.now(), updatedAt: Date.now(),
    views: 0, quoteRequests: 0,
  });

  const update = (patch: Partial<SupplierListing>) => setData((d) => ({ ...d, ...patch }));

  const applyTemplate = (t: Template) => {
    setSelectedTpl(t.key);
    if (t.key === "custom") {
      update({ industry: "", category: "", description: "" });
      return;
    }
    update({
      industry: t.industry, category: t.category,
      unit: t.unit, moq: t.moq, leadTime: t.leadTime,
      description: t.description,
    });
  };

  const handleAutoFill = () => {
    if (!data.name.trim()) return;
    update(autoFill(data.name));
  };

  const checks = [
    { key: "name", label: "Product name", missingMsg: "Add a product name", ok: data.name.trim().length >= 4 },
    { key: "price", label: "Price", missingMsg: "Add a price or choose quote-only", ok: data.priceType === "quote" || (data.priceType === "fixed" ? (data.fixedPrice ?? 0) > 0 : !!(data.minPrice && data.maxPrice)) },
    { key: "moq", label: "Minimum order", missingMsg: "Add minimum order", ok: data.moq > 0 },
    { key: "category", label: "Category", missingMsg: "Choose a template or category", ok: !!data.category },
    { key: "photo", label: "Photo", missingMsg: "Add a photo (or use placeholder)", ok: !!data.images[0] },
  ];
  const optionalChecks = [{ key: "desc", label: "Description", ok: data.description.trim().length >= 15 }];

  const sensitive = isSensitive(data.industry);
  const requiredMet = checks.every((c) => c.ok);

  const save = (status: SupplierListing["status"]) => {
    const finalStatus: SupplierListing["status"] = sensitive && status === "Active" ? "Pending Review" : status;
    saveListing({ ...data, status: finalStatus });
    nav({ to: "/supplier-portal/products" });
  };

  return (
    <div className="max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display text-3xl">Add a Product Listing</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Create a clean supplier listing in under 2 minutes. Choose a template, add the basics, and PSG will format the listing for buyers.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        {/* LEFT — form sections */}
        <div className="space-y-8 min-w-0">

          {/* SECTION 1 — Templates */}
          <section>
            <h3 className="font-display text-xl">What are you selling?</h3>
            <p className="text-sm text-muted-foreground mb-4">Choose a template so we can auto-fill common details for you.</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => {
                const active = selectedTpl === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className={`text-left rounded-xl border-2 p-4 transition bg-card hover:border-primary/50 ${active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-3xl">{t.icon}</div>
                      {active && <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Check size={12} /> Selected</span>}
                    </div>
                    <div className="font-semibold text-sm mt-2">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.blurb}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 2 — Basic listing */}
          <section>
            <h3 className="font-display text-xl">Basic Listing Details</h3>
            <p className="text-sm text-muted-foreground mb-4">Only these fields are needed to create your listing.</p>

            <div className="rounded-xl border bg-card p-5 space-y-5">
              {/* Photo */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="shrink-0">
                  <div className="relative size-32 rounded-lg overflow-hidden bg-muted border">
                    <img src={data.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => update({ images: [`https://picsum.photos/seed/${data.id}-${Date.now()}/800/600`] })}
                      className="w-32 text-xs border rounded px-2 py-1.5 inline-flex items-center gap-1 justify-center hover:bg-muted"
                    >
                      <Camera size={12} /> Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ images: [PLACEHOLDER_IMG] })}
                      className="w-32 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Use Placeholder
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[8rem]">Add a photo to improve buyer trust.</p>
                </div>

                <div className="flex-1 min-w-0">
                  <label className="block">
                    <div className="text-sm font-medium mb-1">Product name</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={data.name}
                        onChange={(e) => update({ name: e.target.value })}
                        placeholder="Example: Premium Well-Milled Rice 50kg Sack"
                        className="flex-1 min-w-0 border rounded-md px-3 py-2 text-sm bg-card"
                      />
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        disabled={!data.name.trim()}
                        className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-md border-2 border-primary/40 bg-primary/10 text-primary font-semibold whitespace-nowrap disabled:opacity-50 hover:bg-primary/15"
                        title="Fill category, unit, MOQ, description from product name"
                      >
                        <Sparkles size={14} /> Auto-fill
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Example: Premium Well-Milled Rice 50kg Sack</p>
                  </label>
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="text-sm font-medium mb-1">How do you price this?</div>
                <div className="grid grid-cols-3 gap-2 max-w-md">
                  {(["fixed", "range", "quote"] as PriceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update({ priceType: t })}
                      className={`p-2 rounded-md border text-xs ${data.priceType === t ? "border-primary bg-primary/5 font-semibold" : "hover:bg-muted"}`}
                    >
                      {t === "fixed" ? "Fixed price" : t === "range" ? "Price range" : "Quote only"}
                    </button>
                  ))}
                </div>
                <div className="mt-2 grid sm:grid-cols-2 gap-3 max-w-md">
                  {data.priceType === "fixed" && (
                    <SimpleField type="number" label="Price (₱)" hint="Leave blank if price is quote-only" value={String(data.fixedPrice ?? "")} onChange={(v) => update({ fixedPrice: Number(v) || undefined })} placeholder="0.00" />
                  )}
                  {data.priceType === "range" && (
                    <>
                      <SimpleField type="number" label="Min (₱)" value={String(data.minPrice ?? "")} onChange={(v) => update({ minPrice: Number(v) || undefined })} />
                      <SimpleField type="number" label="Max (₱)" value={String(data.maxPrice ?? "")} onChange={(v) => update({ maxPrice: Number(v) || undefined })} />
                    </>
                  )}
                  {data.priceType === "quote" && (
                    <div className="sm:col-span-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">Buyers will request a custom quote.</div>
                  )}
                </div>
              </div>

              {/* Unit + MOQ + Lead time + Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Unit</div>
                  <select value={data.unit} onChange={(e) => update({ unit: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-card">
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">How the product is sold (e.g. sack, box).</p>
                </div>
                <SimpleField
                  type="number"
                  label="Minimum order"
                  hint="Smallest order you accept"
                  value={String(data.moq)}
                  onChange={(v) => update({ moq: Number(v) || 1 })}
                  placeholder="10"
                />
                <SimpleField
                  label="How fast can you deliver?"
                  hint="Example: 2–3 business days"
                  value={data.leadTime}
                  onChange={(v) => update({ leadTime: v })}
                  placeholder="2–3 business days"
                />
                <SimpleField
                  label="Where do you supply?"
                  hint="City / region you deliver to"
                  value={data.pickupLocation ?? ""}
                  onChange={(v) => update({ pickupLocation: v })}
                  placeholder="Malolos, Bulacan"
                />
              </div>

              {sensitive && (
                <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 text-sm flex gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-amber-900 flex-1">
                    This product may need document review before going live.
                    <div className="mt-2">
                      <button type="button" className="text-xs px-2 py-1 rounded border border-amber-600 text-amber-900 font-semibold bg-white hover:bg-amber-100">
                        Upload documents later
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Optional details */}
            <div className="mt-4 rounded-xl border bg-card">
              <button
                type="button"
                onClick={() => setShowMore((s) => !s)}
                className="w-full flex items-center justify-between p-4 text-sm font-semibold hover:bg-muted/40"
              >
                <span>Add more details (optional)</span>
                {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showMore && (
                <div className="p-4 pt-0 space-y-3 border-t">
                  <SimpleTextArea label="Description" value={data.description} onChange={(v) => update({ description: v })} placeholder="Grade, use case, packaging, quality, delivery terms." />
                  <div className="grid md:grid-cols-2 gap-3">
                    <SimpleField label="Brand" value={data.brand ?? ""} onChange={(v) => update({ brand: v })} placeholder="Brand" />
                    <SimpleField label="SKU / Model" value={data.sku ?? ""} onChange={(v) => update({ sku: v })} placeholder="SKU" />
                    <div>
                      <div className="text-sm font-medium mb-1">Stock status</div>
                      <select value={data.stockStatus} onChange={(e) => update({ stockStatus: e.target.value as SupplierListing["stockStatus"] })} className="w-full border rounded-md px-3 py-2 text-sm bg-card">
                        <option>In stock</option><option>Made to order</option><option>Pre-order</option><option>Limited stock</option>
                      </select>
                    </div>
                    <SimpleField label="Service regions" value={data.regions ?? ""} onChange={(v) => update({ regions: v })} placeholder="NCR, Central Luzon" />
                    <SimpleField label="Certifications" value={data.certifications ?? ""} onChange={(v) => update({ certifications: v })} placeholder="FDA, ISO, DTI" />
                    <SimpleField label="Delivery notes" value={data.deliveryNotes ?? ""} onChange={(v) => update({ deliveryNotes: v })} placeholder="Free delivery in Metro Manila above ₱20k" />
                  </div>
                  <SimpleTextArea label="Product specs" value={data.specification ?? ""} onChange={(v) => update({ specification: v })} placeholder="Dimensions, composition, grade..." />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT — Preview + Checklist (sticky) */}
        <aside className="space-y-4 lg:sticky lg:top-4 self-start">
          <div>
            <h3 className="font-display text-xl">Buyer Preview</h3>
            <p className="text-sm text-muted-foreground mb-3">This is how your listing will appear in the marketplace.</p>
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-muted">
                <img src={data.images[0]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-2">
                <div className="font-semibold text-base leading-tight">{data.name || "Your product name"}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck size={12} className="text-success" />
                  <span className="font-medium text-foreground">{data.supplierName}</span>
                  {CURRENT_SUPPLIER.verified && <span className="text-success font-semibold">· Verified</span>}
                </div>
                <div className="text-lg font-display text-primary">{priceLabel(data)}</div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground pt-1 border-t">
                  <div><span className="text-foreground/70">MOQ:</span> {data.moq} {data.unit}</div>
                  <div><span className="text-foreground/70">Lead:</span> {data.leadTime || "—"}</div>
                  <div className="col-span-2"><span className="text-foreground/70">Ships from:</span> {data.pickupLocation || "—"}</div>
                </div>
                <button type="button" disabled className="w-full mt-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md py-2 opacity-90 cursor-default">
                  Request Quote
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="font-semibold text-sm mb-2">Listing Checklist</div>
            <ul className="space-y-1.5 text-sm">
              {checks.map((c) => (
                <li key={c.key} className="flex items-start gap-2">
                  <span className={`mt-0.5 inline-flex size-4 rounded-full items-center justify-center text-[10px] shrink-0 ${c.ok ? "bg-success text-white" : "bg-muted text-muted-foreground border"}`}>
                    {c.ok ? <Check size={10} /> : "!"}
                  </span>
                  <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                    {c.ok ? c.label : c.missingMsg}
                  </span>
                </li>
              ))}
              {optionalChecks.map((c) => (
                <li key={c.key} className="flex items-start gap-2 text-muted-foreground">
                  <span className="mt-0.5 inline-flex size-4 rounded-full items-center justify-center text-[10px] shrink-0 bg-muted border">○</span>
                  <span>{c.label} <span className="text-xs">(optional)</span></span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur z-40 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-3 justify-end">
          {!requiredMet && (
            <div className="text-xs text-muted-foreground mr-auto">Complete required fields first.</div>
          )}
          <ActionButton
            label="Save Draft"
            hint="Finish later"
            onClick={() => save("Draft")}
            variant="ghost"
          />
          <ActionButton
            label="Submit for Review"
            hint="For products that need approval"
            onClick={() => save("Pending Review")}
            disabled={!requiredMet}
            variant="primary"
          />
          {CURRENT_SUPPLIER.verified && !sensitive && (
            <ActionButton
              label="Publish Now"
              hint="Go live immediately if eligible"
              onClick={() => save("Active")}
              disabled={!requiredMet}
              variant="success"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, hint, onClick, disabled, variant }: {
  label: string; hint: string; onClick: () => void; disabled?: boolean;
  variant: "ghost" | "primary" | "success";
}) {
  const cls =
    variant === "primary" ? "bg-primary text-primary-foreground" :
    variant === "success" ? "bg-success text-white" :
    "border";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left px-4 py-2 rounded-md font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed ${cls}`}
    >
      <div>{label}</div>
      <div className={`text-[10px] font-normal opacity-80`}>{hint}</div>
    </button>
  );
}

function SimpleField({ label, hint, value, onChange, placeholder, type = "text" }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 text-sm bg-card"
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </label>
  );
}

function SimpleTextArea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1">{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full border rounded-md px-3 py-2 text-sm bg-card" />
    </label>
  );
}
