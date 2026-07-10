import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  isSensitive, newListingId, PLACEHOLDER_IMG, saveListing, UNIT_OPTIONS,
  type PriceType, type SupplierListing,
} from "@/lib/supplier-listings";
import { Sparkles, AlertTriangle, ChevronDown, ChevronUp, Camera, Check } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/products/new")({
  component: SimpleListingForm,
});

const CURRENT_SUPPLIER = { id: "sup_001", name: "Bulacan Grain & Rice Mills Inc.", verified: true };

type Template = {
  key: string;
  label: string;
  icon: string;
  industry: string;
  category: string;
  unit: string;
  moq: number;
  leadTime: string;
  description: string;
};

const TEMPLATES: Template[] = [
  { key: "rice", label: "Rice / Grains", icon: "🌾", industry: "Agriculture & Fresh Produce", category: "Rice & Grains", unit: "sack", moq: 10, leadTime: "2–3 business days", description: "Bulk rice supply for restaurants, retailers, and food service businesses." },
  { key: "boxes", label: "Packaging Boxes", icon: "📦", industry: "Packaging Materials", category: "Boxes & Cartons", unit: "carton", moq: 100, leadTime: "7–14 business days", description: "Bulk packaging supply for food service, retail, and e-commerce businesses." },
  { key: "cleaning", label: "Cleaning Liquid", icon: "🧴", industry: "Cleaning & Hygiene", category: "Cleaning Solutions", unit: "gallon", moq: 12, leadTime: "2–5 business days", description: "Concentrated cleaning solution for hotels, offices, and food service." },
  { key: "cement", label: "Cement / Construction", icon: "🧱", industry: "Construction Materials", category: "Cement", unit: "bundle", moq: 50, leadTime: "3–7 business days", description: "Construction-grade material for contractors and developers." },
  { key: "coffee", label: "Coffee Beans", icon: "☕", industry: "Beverages", category: "Coffee", unit: "kg", moq: 20, leadTime: "3–5 business days", description: "Roasted coffee beans for cafés, hotels, and offices." },
  { key: "medical", label: "Medical Supplies", icon: "🩺", industry: "Medical Supplies & Devices", category: "PPE & Consumables", unit: "box", moq: 100, leadTime: "5–7 business days", description: "Medical-grade consumables for clinics, hospitals, and pharmacies." },
  { key: "hotel", label: "Hotel Supplies", icon: "🏨", industry: "Hotel & Hospitality Supplies", category: "Amenities & Linen", unit: "carton", moq: 20, leadTime: "5–10 business days", description: "Hotel amenities and linen for resorts, hotels, and short-stays." },
  { key: "apparel", label: "Apparel / Uniforms", icon: "🧵", industry: "Textile & Garments", category: "Uniforms", unit: "piece", moq: 50, leadTime: "10–14 business days", description: "Custom uniforms and apparel for corporates, schools, and hospitality." },
  { key: "electronics", label: "Electronics", icon: "📺", industry: "Electronics & Appliances", category: "Small Appliances", unit: "piece", moq: 10, leadTime: "5–10 business days", description: "Electronic products for retailers, offices, and distributors." },
  { key: "custom", label: "Custom Product", icon: "✨", industry: "", category: "", unit: "piece", moq: 1, leadTime: "", description: "" },
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

function SimpleListingForm() {
  const nav = useNavigate();
  const [showMore, setShowMore] = useState(false);
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

  // Quality score
  const checks = [
    { key: "name", label: "Product name", ok: data.name.trim().length >= 4 },
    { key: "price", label: "Price", ok: data.priceType === "quote" || (data.priceType === "fixed" ? (data.fixedPrice ?? 0) > 0 : !!data.minPrice) },
    { key: "moq", label: "MOQ", ok: data.moq > 0 },
    { key: "category", label: "Category", ok: !!data.category },
    { key: "photo", label: "Photo", ok: data.images[0]?.length > 0 },
    { key: "desc", label: "Description", ok: data.description.trim().length >= 15 },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const quality = passed >= 5 ? "Good" : passed >= 3 ? "Fair" : "Needs details";

  const sensitive = isSensitive(data.industry);
  const requiredMet = data.name.trim().length >= 4 && !!data.category && data.moq > 0 &&
    (data.priceType === "quote" || data.priceType === "range" || (data.fixedPrice ?? 0) > 0);

  const save = (status: SupplierListing["status"]) => {
    const finalStatus: SupplierListing["status"] = sensitive && status === "Active" ? "Pending Review" : status;
    saveListing({ ...data, status: finalStatus });
    nav({ to: "/supplier-portal/products" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="font-display text-2xl">Tell us what you sell.</h2>
        <p className="text-sm text-muted-foreground">We'll format the listing for you. Should take under 2 minutes.</p>
      </div>

      {/* Templates */}
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Start with a template</div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => applyTemplate(t)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border bg-card hover:border-primary/60"
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photo + core fields */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="shrink-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Photo</div>
            <div className="relative size-32 rounded-lg overflow-hidden bg-muted border">
              <img src={data.images[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => update({ images: [`https://picsum.photos/seed/${data.id}-${Date.now()}/800/600`] })}
              className="mt-2 w-32 text-xs border rounded px-2 py-1.5 inline-flex items-center gap-1 justify-center"
            >
              <Camera size={12} /> Replace photo
            </button>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <Label>Product name *</Label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Example: Premium Well-Milled Rice 50kg Sack"
                  className="flex-1 border rounded-md px-3 py-2 text-sm bg-card"
                />
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={!data.name.trim()}
                  className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded border bg-primary/5 text-primary font-semibold whitespace-nowrap disabled:opacity-50"
                  title="Fill category, unit, MOQ, description from product name"
                >
                  <Sparkles size={12} /> Auto-fill listing
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category *" value={data.category} onChange={(v) => update({ category: v })} placeholder="e.g. Rice & Grains" />
              <div>
                <Label>Unit *</Label>
                <select value={data.unit} onChange={(e) => update({ unit: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-card mt-1">
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Price + MOQ */}
        <div className="grid md:grid-cols-4 gap-3 border-t pt-4">
          <div className="md:col-span-2">
            <Label>Price type</Label>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {(["fixed", "range", "quote"] as PriceType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ priceType: t })}
                  className={`p-2 rounded border text-xs capitalize ${data.priceType === t ? "border-primary bg-primary/5 font-semibold" : ""}`}
                >
                  {t === "fixed" ? "Fixed" : t === "range" ? "Range" : "Quote only"}
                </button>
              ))}
            </div>
          </div>
          {data.priceType === "fixed" && (
            <div className="md:col-span-2">
              <Field type="number" label="Price (₱) *" value={String(data.fixedPrice ?? "")} onChange={(v) => update({ fixedPrice: Number(v) || undefined })} placeholder="0.00" />
            </div>
          )}
          {data.priceType === "range" && (
            <>
              <Field type="number" label="Min (₱) *" value={String(data.minPrice ?? "")} onChange={(v) => update({ minPrice: Number(v) || undefined })} />
              <Field type="number" label="Max (₱) *" value={String(data.maxPrice ?? "")} onChange={(v) => update({ maxPrice: Number(v) || undefined })} />
            </>
          )}
          {data.priceType === "quote" && (
            <div className="md:col-span-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">Buyers request custom quote.</div>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <Field type="number" label={`MOQ (${data.unit}) *`} value={String(data.moq)} onChange={(v) => update({ moq: Number(v) || 1 })} placeholder="10" />
          <Field label="Lead time *" value={data.leadTime} onChange={(v) => update({ leadTime: v })} placeholder="2–3 business days" />
          <Field label="Location / service area" value={data.pickupLocation ?? ""} onChange={(v) => update({ pickupLocation: v })} placeholder="Malolos, Bulacan" />
        </div>

        {sensitive && (
          <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 text-sm flex gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-amber-900 flex-1">
              This product category may require document review before going live.
              <div className="text-xs text-amber-800 mt-1">You can upload documents later — listing will show as Pending Compliance Review.</div>
            </div>
          </div>
        )}
      </div>

      {/* Add more details (collapsible) */}
      <div className="rounded-lg border bg-card">
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="w-full flex items-center justify-between p-4 text-sm font-semibold"
        >
          <span>Add more details (optional)</span>
          {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showMore && (
          <div className="p-4 pt-0 space-y-3 border-t">
            <TextArea label="Description" value={data.description} onChange={(v) => update({ description: v })} placeholder="Grade, use case, packaging, quality, delivery terms." />
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Brand" value={data.brand ?? ""} onChange={(v) => update({ brand: v })} placeholder="Brand" />
              <Field label="SKU / Model" value={data.sku ?? ""} onChange={(v) => update({ sku: v })} placeholder="SKU" />
              <div>
                <Label>Stock status</Label>
                <select value={data.stockStatus} onChange={(e) => update({ stockStatus: e.target.value as SupplierListing["stockStatus"] })} className="w-full border rounded-md px-3 py-2 text-sm bg-card mt-1">
                  <option>In stock</option><option>Made to order</option><option>Pre-order</option><option>Limited stock</option>
                </select>
              </div>
              <Field label="Service regions" value={data.regions ?? ""} onChange={(v) => update({ regions: v })} placeholder="NCR, Central Luzon" />
              <Field label="Certifications" value={data.certifications ?? ""} onChange={(v) => update({ certifications: v })} placeholder="FDA, ISO, DTI" />
              <Field label="Delivery notes" value={data.deliveryNotes ?? ""} onChange={(v) => update({ deliveryNotes: v })} placeholder="Free delivery in Metro Manila above ₱20k" />
            </div>
            <TextArea label="Product spec" value={data.specification ?? ""} onChange={(v) => update({ specification: v })} placeholder="Dimensions, composition, grade..." />
          </div>
        )}
      </div>

      {/* Quality & submit */}
      <div className="rounded-lg border bg-card p-4 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Listing quality</div>
            <div className={`text-lg font-display ${quality === "Good" ? "text-success" : quality === "Fair" ? "text-amber-600" : "text-muted-foreground"}`}>{quality}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {checks.map((c) => (
              <span key={c.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${c.ok ? "bg-success/10 border-success/30 text-success" : "bg-muted text-muted-foreground"}`}>
                {c.ok && <Check size={10} />} {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => save("Draft")} className="text-sm px-4 py-2 rounded border font-semibold">Save Draft</button>
          <button
            onClick={() => save("Pending Review")}
            disabled={!requiredMet}
            className="text-sm px-4 py-2 rounded bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            Submit Listing
          </button>
          {CURRENT_SUPPLIER.verified && !sensitive && (
            <button
              onClick={() => save("Active")}
              disabled={!requiredMet}
              className="text-sm px-4 py-2 rounded bg-success text-white font-semibold disabled:opacity-50"
            >
              Publish Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{children}</div>;
}
function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 text-sm bg-card mt-1" />
    </div>
  );
}
function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full border rounded-md px-3 py-2 text-sm bg-card mt-1" />
    </div>
  );
}
