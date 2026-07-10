import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { industries } from "@/lib/industries";
import {
  isSensitive, newListingId, PLACEHOLDER_IMG, saveListing, UNIT_OPTIONS,
  type PriceType, type SupplierListing,
} from "@/lib/supplier-listings";
import { Check, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/products/new")({
  component: ListingWizard,
});

const steps = ["Category", "Basic info", "Pricing & MOQ", "Supply & Delivery", "Requirements", "Preview"];

const CURRENT_SUPPLIER = { id: "sup_001", name: "Bulacan Grain & Rice Mills Inc.", verified: true };

function ListingWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
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
  const canNext = () => {
    if (step === 0) return !!data.industry && !!data.category;
    if (step === 1) return data.name.length >= 8 && data.description.length >= 20 && !!data.unit;
    if (step === 2) return data.moq > 0 && !!data.leadTime && (data.priceType === "quote" || data.priceType === "range" || (data.fixedPrice ?? 0) > 0);
    return true;
  };

  const save = (status: SupplierListing["status"]) => {
    saveListing({ ...data, status });
    nav({ to: "/supplier-portal/products" });
  };

  const sensitive = isSensitive(data.industry);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ol className="flex items-center gap-2 text-xs overflow-x-auto">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 ${i === step ? "text-primary font-semibold" : i < step ? "text-success" : "text-muted-foreground"}`}>
            <span className={`size-6 grid place-items-center rounded-full border-2 ${i === step ? "border-primary bg-primary text-white" : i < step ? "border-success bg-success text-white" : "border-border"}`}>
              {i < step ? <Check size={12} /> : i + 1}
            </span>
            <span className="whitespace-nowrap">{s}</span>
            {i < steps.length - 1 && <ChevronRight size={12} className="text-muted-foreground" />}
          </li>
        ))}
      </ol>

      <div className="rounded-lg border bg-card p-6 space-y-5">
        {step === 0 && (
          <>
            <h2 className="font-display text-2xl">What are you selling?</h2>
            <div>
              <Label>Industry</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-96 overflow-y-auto pr-1">
                {industries.map((i) => (
                  <button key={i.name} type="button" onClick={() => update({ industry: i.name })}
                    className={`text-left p-3 rounded-md border text-sm hover:border-primary/60 ${data.industry === i.name ? "border-primary bg-primary/5" : ""}`}>
                    <div className="text-lg">{i.icon}</div>
                    <div className="font-medium leading-tight mt-1">{i.name}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Category" value={data.category} onChange={(v) => update({ category: v })} placeholder="e.g. Rice & Grains" />
              <Field label="Subcategory (optional)" value={data.subcategory ?? ""} onChange={(v) => update({ subcategory: v })} placeholder="e.g. Premium" />
            </div>
            {sensitive && <ComplianceNote />}
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-2xl">Basic product info</h2>
            <Field label="Product name *" value={data.name} onChange={(v) => update({ name: v })}
              placeholder="Example: Premium Well-Milled Rice 50kg Sack" />
            {data.name.length > 0 && data.name.length < 8 && (
              <p className="text-xs text-destructive">Please add more product details so buyers understand what you sell.</p>
            )}
            <TextArea label="Short description *" value={data.description} onChange={(v) => update({ description: v })}
              placeholder="Describe grade, use case, packaging, quality, and delivery terms." />
            {data.description.length > 0 && data.description.length < 20 && (
              <p className="text-xs text-destructive">Please add more product details so buyers understand what you sell.</p>
            )}
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Brand (optional)" value={data.brand ?? ""} onChange={(v) => update({ brand: v })} placeholder="Brand" />
              <Field label="SKU / Model (optional)" value={data.sku ?? ""} onChange={(v) => update({ sku: v })} placeholder="SKU" />
              <div>
                <Label>Unit of measure *</Label>
                <select value={data.unit} onChange={(e) => update({ unit: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-card mt-1">
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Product photo (demo — placeholder used)</Label>
              <div className="mt-2 flex items-center gap-3">
                <img src={data.images[0]} className="size-20 rounded object-cover bg-muted" alt="" />
                <button type="button" onClick={() => update({ images: [`https://picsum.photos/seed/${data.id}-${Date.now()}/800/600`] })}
                  className="text-xs border rounded px-3 py-1.5">Regenerate placeholder</button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-2xl">Pricing & MOQ</h2>
            <div>
              <Label>Price type</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(["fixed", "range", "quote"] as PriceType[]).map((t) => (
                  <button key={t} type="button" onClick={() => update({ priceType: t })}
                    className={`p-3 rounded-md border text-sm capitalize ${data.priceType === t ? "border-primary bg-primary/5 font-semibold" : ""}`}>
                    {t === "fixed" ? "Fixed price" : t === "range" ? "Price range" : "Quote only"}
                  </button>
                ))}
              </div>
            </div>
            {data.priceType === "fixed" && (
              <Field type="number" label="Unit price (₱)" value={String(data.fixedPrice ?? "")}
                onChange={(v) => update({ fixedPrice: Number(v) || undefined })} placeholder="0.00" />
            )}
            {data.priceType === "range" && (
              <div className="grid grid-cols-2 gap-3">
                <Field type="number" label="Minimum price (₱)" value={String(data.minPrice ?? "")} onChange={(v) => update({ minPrice: Number(v) || undefined })} />
                <Field type="number" label="Maximum price (₱)" value={String(data.maxPrice ?? "")} onChange={(v) => update({ maxPrice: Number(v) || undefined })} />
              </div>
            )}
            {data.priceType === "quote" && (
              <div className="rounded-md bg-muted p-3 text-sm">Price available upon custom quote.</div>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              <Field type="number" label={`Minimum order quantity (${data.unit})`} value={String(data.moq)}
                onChange={(v) => update({ moq: Number(v) || 1 })} placeholder="Example: 10" />
              <Field label="Lead time" value={data.leadTime} onChange={(v) => update({ leadTime: v })} placeholder="Example: 2–3 business days" />
            </div>
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={data.bulkDiscount} onChange={(e) => update({ bulkDiscount: e.target.checked })} /> Bulk discount available</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={data.sampleAvailable} onChange={(e) => update({ sampleAvailable: e.target.checked })} /> Sample available</label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-2xl">Supply & delivery</h2>
            <div>
              <Label>Stock status</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                {(["In stock", "Made to order", "Pre-order", "Limited stock"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => update({ stockStatus: s })}
                    className={`p-2 rounded-md border text-xs ${data.stockStatus === s ? "border-primary bg-primary/5 font-semibold" : ""}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Production capacity" value={data.capacity ?? ""} onChange={(v) => update({ capacity: v })} placeholder="e.g. 500 sacks/day" />
              <Field label="Service regions" value={data.regions ?? ""} onChange={(v) => update({ regions: v })} placeholder="e.g. NCR, Central Luzon" />
              <Field label="Pickup location" value={data.pickupLocation ?? ""} onChange={(v) => update({ pickupLocation: v })} placeholder="e.g. Malolos, Bulacan" />
              <div>
                <Label>Delivery</Label>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={data.deliveryAvailable} onChange={(e) => update({ deliveryAvailable: e.target.checked })} /> Delivery available
                </label>
              </div>
              <div className="md:col-span-2">
                <Field label="Delivery notes" value={data.deliveryNotes ?? ""} onChange={(v) => update({ deliveryNotes: v })} placeholder="Free delivery within Metro Manila for orders above ₱20,000" />
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-display text-2xl">Requirements & documents</h2>
            <TextArea label="Product specification" value={data.specification ?? ""} onChange={(v) => update({ specification: v })} placeholder="Grade, dimensions, composition..." />
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Certifications available" value={data.certifications ?? ""} onChange={(v) => update({ certifications: v })} placeholder="e.g. FDA, DTI, ISO" />
              <Field label="Compliance documents" value={data.complianceDocs ?? ""} onChange={(v) => update({ complianceDocs: v })} placeholder="e.g. BFAD, PNS" />
              <Field label="Expiry date (if applicable)" value={data.expiry ?? ""} onChange={(v) => update({ expiry: v })} placeholder="e.g. 12 months" />
              <div>
                <Label>Tracking</Label>
                <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!data.sdsRequired} onChange={(e) => update({ sdsRequired: e.target.checked })} /> Safety Data Sheet required</label>
                <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!data.batchTracking} onChange={(e) => update({ batchTracking: e.target.checked })} /> Batch / lot tracking</label>
              </div>
            </div>
            {sensitive && <ComplianceNote />}
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="font-display text-2xl">Preview listing</h2>
            <p className="text-sm text-muted-foreground">This is how buyers will see your product on the marketplace.</p>
            <div className="max-w-xs rounded-lg border bg-card overflow-hidden">
              <div className="aspect-[4/3] bg-muted"><img src={data.images[0]} className="w-full h-full object-cover" alt="" /></div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-xl text-primary leading-none">
                    {data.priceType === "quote" ? "Request Quote"
                      : data.priceType === "range" ? `₱${data.minPrice}–${data.maxPrice}`
                      : `₱${data.fixedPrice ?? 0}`}
                  </div>
                  <div className="text-xs text-muted-foreground">/ {data.unit}</div>
                </div>
                <div className="text-sm font-medium line-clamp-2">{data.name || "Product name"}</div>
                <div className="text-[11px] text-muted-foreground">{data.category}</div>
                <div className="text-xs text-muted-foreground">MOQ {data.moq} {data.unit} · {data.leadTime || "Lead time"}</div>
                <div className="pt-1.5 border-t mt-2 text-xs">{data.supplierName} {CURRENT_SUPPLIER.verified && "· ✓"}</div>
                {sensitive && <span className="chip bg-destructive/10 text-destructive text-[10px]">Compliance review required</span>}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded border disabled:opacity-40">
            <ChevronLeft size={14} /> Back
          </button>
          <div className="flex gap-2">
            {step === steps.length - 1 ? (
              <>
                <button onClick={() => save("Draft")} className="text-sm px-4 py-2 rounded border font-semibold">Save Draft</button>
                <button onClick={() => save("Pending Review")} className="text-sm px-4 py-2 rounded bg-primary text-primary-foreground font-semibold">Submit for Review</button>
                {CURRENT_SUPPLIER.verified && !sensitive && (
                  <button onClick={() => save("Active")} className="text-sm px-4 py-2 rounded bg-success text-white font-semibold">Publish Now</button>
                )}
              </>
            ) : (
              <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
                className="inline-flex items-center gap-1 text-sm px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
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
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4}
        className="w-full border rounded-md px-3 py-2 text-sm bg-card mt-1" />
    </div>
  );
}
function ComplianceNote() {
  return (
    <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 text-sm flex gap-2">
      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="text-amber-900">This category may require document review before the listing goes live.</div>
    </div>
  );
}
