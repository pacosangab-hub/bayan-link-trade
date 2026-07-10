import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Upload, Check, AlertCircle, ClipboardPaste } from "lucide-react";
import { newListingId, saveListing, type SupplierListing, PLACEHOLDER_IMG } from "@/lib/supplier-listings";

export const Route = createFileRoute("/supplier-portal/products/bulk-upload")({
  component: BulkUpload,
});

type Row = {
  product_name: string;
  category: string;
  unit: string;
  moq: string;
  fixed_price: string;
  lead_time: string;
  location: string;
  error: string | null;
};

const CSV_SAMPLE: Row[] = [
  { product_name: "Refined Sugar 50kg Sack", category: "Sugar", unit: "sack", moq: "10", fixed_price: "2800", lead_time: "3 days", location: "Batangas", error: null },
  { product_name: "PET Bottle 500ml", category: "Bottles", unit: "carton", moq: "20", fixed_price: "980", lead_time: "5 days", location: "Cavite", error: null },
  { product_name: "Cheap", category: "Detergent", unit: "gallon", moq: "1", fixed_price: "0", lead_time: "", location: "", error: "Product name too short and price missing." },
  { product_name: "Ethanol 70% 1-Gallon", category: "Solvents", unit: "gallon", moq: "12", fixed_price: "420", lead_time: "5 days", location: "Bulacan", error: null },
];

const SAMPLE_TEXT = `Premium Rice 50kg Sack, ₱2450, MOQ 10 sacks
Jasmine Rice 25kg Sack, ₱1550, MOQ 10 sacks
Rice Bran Feed Sack, ₱800, MOQ 20 sacks`;

function parsePastedText(text: string): Row[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      const name = parts[0] ?? "";
      const priceRaw = parts[1] ?? "";
      const moqRaw = parts[2] ?? "";
      const price = (priceRaw.match(/[\d,.]+/)?.[0] ?? "").replace(/,/g, "");
      const moqMatch = moqRaw.match(/(\d+)\s*([a-zA-Z]+)?/);
      const moq = moqMatch?.[1] ?? "1";
      const unit = moqMatch?.[2] ?? "piece";
      const guess = guessCategory(name);
      const error = !name || name.length < 4 ? "Product name too short." : !price ? "Price missing." : null;
      return {
        product_name: name,
        category: guess.category,
        unit,
        moq,
        fixed_price: price,
        lead_time: guess.leadTime,
        location: "Metro Manila",
        error,
      };
    });
}

function guessCategory(name: string): { category: string; leadTime: string } {
  const n = name.toLowerCase();
  if (/rice|grain/.test(n)) return { category: "Rice & Grains", leadTime: "2–3 days" };
  if (/coffee/.test(n)) return { category: "Coffee", leadTime: "3–5 days" };
  if (/box|carton|packag/.test(n)) return { category: "Packaging", leadTime: "7–14 days" };
  if (/detergent|soap|clean/.test(n)) return { category: "Cleaning", leadTime: "3–5 days" };
  if (/cement|steel/.test(n)) return { category: "Construction", leadTime: "5–7 days" };
  return { category: "General", leadTime: "3–5 days" };
}

function BulkUpload() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"paste" | "csv" | null>(null);
  const [pasted, setPasted] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const valid = rows.filter((r) => !r.error);

  const convertPaste = () => {
    setRows(parsePastedText(pasted));
  };

  const loadCsvDemo = () => {
    setMode("csv");
    setRows(CSV_SAMPLE);
  };

  const useSample = () => {
    setMode("paste");
    setPasted(SAMPLE_TEXT);
    setRows(parsePastedText(SAMPLE_TEXT));
  };

  const submitAll = () => {
    valid.forEach((r) => {
      const listing: SupplierListing = {
        id: newListingId(),
        supplierId: "sup_001",
        supplierName: "Bulacan Grain & Rice Mills Inc.",
        industry: "Food Manufacturing & FMCG",
        category: r.category,
        name: r.product_name,
        description: `${r.product_name} — bulk upload.`,
        images: [PLACEHOLDER_IMG],
        unit: r.unit,
        moq: Number(r.moq) || 1,
        priceType: "fixed",
        fixedPrice: Number(r.fixed_price) || undefined,
        bulkDiscount: false, sampleAvailable: false,
        leadTime: r.lead_time,
        stockStatus: "In stock",
        pickupLocation: r.location,
        deliveryAvailable: true,
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
        <h2 className="font-display text-2xl">Bulk Upload Products</h2>
        <p className="text-sm text-muted-foreground">Add many products at once. Choose an option below.</p>
      </div>

      {mode === null && (
        <div className="grid md:grid-cols-3 gap-3">
          <OptionCard icon={<ClipboardPaste size={22} />} title="Paste product list"
            desc="Paste a text list like: Product Name, ₱Price, MOQ x unit"
            onClick={() => setMode("paste")} />
          <OptionCard icon={<Upload size={22} />} title="Upload CSV demo"
            desc="Load a sample CSV file with 4 rows for preview."
            onClick={loadCsvDemo} />
          <OptionCard icon={<Download size={22} />} title="Use sample template"
            desc="Prefill with a sample paste-list to test the flow."
            onClick={useSample} />
        </div>
      )}

      {mode === "paste" && rows.length === 0 && (
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div>
            <div className="font-semibold text-sm">Paste product list</div>
            <div className="text-xs text-muted-foreground">One product per line. Format: <code>Product Name, ₱Price, MOQ x unit</code></div>
          </div>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={8}
            placeholder={SAMPLE_TEXT}
            className="w-full border rounded-md px-3 py-2 text-sm bg-card font-mono"
          />
          <div className="flex justify-between">
            <button onClick={() => setMode(null)} className="text-sm text-muted-foreground">Back</button>
            <button onClick={convertPaste} disabled={!pasted.trim()} className="text-sm px-4 py-2 rounded bg-primary text-primary-foreground font-semibold disabled:opacity-50">
              Convert to Listings
            </button>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold">Preview — {rows.length} rows</div>
              <div className="text-xs text-muted-foreground">{valid.length} valid · {rows.length - valid.length} errors</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setMode(null); setRows([]); setPasted(""); }} className="text-sm px-3 py-2 rounded border">Start over</button>
              <button onClick={submitAll} disabled={valid.length === 0} className="text-sm px-4 py-2 rounded bg-primary text-primary-foreground font-semibold disabled:opacity-50">
                Submit {valid.length} for Review
              </button>
            </div>
          </div>
          <div className="divide-y">
            {rows.map((r, i) => (
              <div key={i} className="p-3 flex items-start gap-3 text-sm">
                <div className={`mt-1 size-6 rounded-full grid place-items-center ${r.error ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                  {r.error ? <AlertCircle size={14} /> : <Check size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{r.product_name || <span className="text-destructive">(missing name)</span>}</div>
                  <div className="text-xs text-muted-foreground">{r.category} · MOQ {r.moq} {r.unit} · ₱{r.fixed_price || "—"} · {r.lead_time || "no lead time"}</div>
                  {r.error && (
                    <div className="mt-1 text-xs text-destructive flex items-center gap-2">
                      {r.error}
                      <button
                        onClick={() => setRows((rs) => rs.map((x, j) => j === i ? {
                          ...x, error: null,
                          product_name: x.product_name.length < 4 ? "Fixed Product Name" : x.product_name,
                          fixed_price: x.fixed_price || "100",
                          lead_time: x.lead_time || "3 days",
                          location: x.location || "Metro Manila",
                        } : x))}
                        className="text-primary font-semibold"
                      >Auto-fix</button>
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

function OptionCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg border bg-card p-4 text-left hover:border-primary/60 flex flex-col gap-2">
      <div className="text-primary">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
