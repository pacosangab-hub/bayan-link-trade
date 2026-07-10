import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Upload, Check, AlertCircle } from "lucide-react";
import { newListingId, saveListing, type SupplierListing, PLACEHOLDER_IMG } from "@/lib/supplier-listings";

export const Route = createFileRoute("/supplier-portal/products/bulk-upload")({
  component: BulkUpload,
});

const SAMPLE_ROWS = [
  { product_name: "Refined Sugar 50kg Sack", industry: "Food Manufacturing & FMCG", category: "Sugar", unit: "sack", moq: "10", price_type: "fixed", fixed_price: "2800", lead_time: "3 days", stock_status: "In stock", location: "Batangas", error: null },
  { product_name: "PET Bottle 500ml", industry: "Packaging Materials", category: "Bottles", unit: "carton", moq: "20", price_type: "fixed", fixed_price: "980", lead_time: "5 days", stock_status: "In stock", location: "Cavite", error: null },
  { product_name: "Cheap", industry: "Cleaning & Hygiene", category: "Detergent", unit: "gallon", moq: "1", price_type: "fixed", fixed_price: "0", lead_time: "", stock_status: "In stock", location: "", error: "Product name too short and price missing." },
  { product_name: "Ethanol 70% 1-Gallon", industry: "Chemicals & Raw Materials", category: "Solvents", unit: "gallon", moq: "12", price_type: "range", fixed_price: "380–450", lead_time: "5 days", stock_status: "In stock", location: "Bulacan", error: null },
];

function BulkUpload() {
  const nav = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState(SAMPLE_ROWS);

  const valid = rows.filter((r) => !r.error);

  const submitAll = () => {
    valid.forEach((r) => {
      const listing: SupplierListing = {
        id: newListingId(),
        supplierId: "sup_001",
        supplierName: "Bulacan Grain & Rice Mills Inc.",
        industry: r.industry, category: r.category,
        name: r.product_name, description: `${r.product_name} — bulk upload.`,
        images: [PLACEHOLDER_IMG],
        unit: r.unit, moq: Number(r.moq) || 1,
        priceType: r.price_type === "range" ? "range" : r.price_type === "quote" ? "quote" : "fixed",
        fixedPrice: r.price_type === "fixed" ? Number(r.fixed_price) : undefined,
        bulkDiscount: false, sampleAvailable: false,
        leadTime: r.lead_time, stockStatus: r.stock_status as any,
        pickupLocation: r.location, deliveryAvailable: true,
        status: "Pending Review",
        createdAt: Date.now(), updatedAt: Date.now(),
        views: 0, quoteRequests: 0,
      };
      saveListing(listing);
    });
    nav({ to: "/supplier-portal/products" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="font-display text-2xl">Bulk upload products</h2>
        <p className="text-sm text-muted-foreground">Upload many products at once via CSV. Demo mode uses a sample file.</p>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <button className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded font-semibold">
          <Download size={14} /> Download CSV Template
        </button>
        <div className="text-xs text-muted-foreground">
          CSV fields: product_name, industry, category, description, unit, moq, price_type, price_min, price_max, fixed_price, lead_time, stock_status, location, delivery_available, compliance_required
        </div>
        {!loaded && (
          <button onClick={() => setLoaded(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-semibold text-sm">
            <Upload size={14} /> Upload CSV (demo)
          </button>
        )}
      </div>

      {loaded && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold">Preview — {rows.length} rows</div>
              <div className="text-xs text-muted-foreground">{valid.length} valid · {rows.length - valid.length} errors</div>
            </div>
            <button onClick={submitAll} disabled={valid.length === 0} className="text-sm px-4 py-2 rounded bg-primary text-primary-foreground font-semibold disabled:opacity-50">
              Submit {valid.length} for Review
            </button>
          </div>
          <div className="divide-y">
            {rows.map((r, i) => (
              <div key={i} className="p-3 flex items-start gap-3 text-sm">
                <div className={`mt-1 size-6 rounded-full grid place-items-center ${r.error ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                  {r.error ? <AlertCircle size={14} /> : <Check size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{r.product_name || <span className="text-destructive">(missing name)</span>}</div>
                  <div className="text-xs text-muted-foreground">{r.industry} · {r.category} · MOQ {r.moq} {r.unit} · ₱{r.fixed_price || "—"}</div>
                  {r.error && (
                    <div className="mt-1 text-xs text-destructive flex items-center gap-2">
                      {r.error}
                      <button onClick={() => setRows((rs) => rs.map((x, j) => j === i ? { ...x, error: null, product_name: x.product_name || "Fixed product name", fixed_price: x.fixed_price || "100", lead_time: x.lead_time || "3 days", location: x.location || "Metro Manila" } : x))}
                        className="text-primary font-semibold">Auto-fix</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
