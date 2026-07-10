import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { deleteListing, duplicateListing, newListingId, PLACEHOLDER_IMG, saveListing, updateStatus, useSupplierListings, type SupplierListing } from "@/lib/supplier-listings";
import { StatusChip } from "./supplier-portal.index";
import { Plus, Upload, Trash2 } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/products/")({
  component: MyListings,
});

type QuickRow = { name: string; category: string; price: string; unit: string; moq: string; leadTime: string };
const emptyRow = (): QuickRow => ({ name: "", category: "", price: "", unit: "sack", moq: "10", leadTime: "2–3 business days" });

function MyListings() {
  const listings = useSupplierListings();
  const navigate = useNavigate();
  const [showQuick, setShowQuick] = useState(false);
  const [quickRows, setQuickRows] = useState<QuickRow[]>([emptyRow(), emptyRow(), emptyRow()]);

  const updateRow = (i: number, patch: Partial<QuickRow>) =>
    setQuickRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setQuickRows((rs) => [...rs, emptyRow()]);
  const removeRow = (i: number) => setQuickRows((rs) => rs.filter((_, idx) => idx !== i));

  const saveQuickRows = () => {
    const valid = quickRows.filter((r) => r.name.trim() && r.category.trim());
    valid.forEach((r) => {
      const listing: SupplierListing = {
        id: newListingId(),
        supplierId: "sup_001",
        supplierName: "Bulacan Grain & Rice Mills Inc.",
        industry: "Food Manufacturing & FMCG",
        category: r.category,
        name: r.name,
        description: `${r.name} — bulk supply for wholesale buyers.`,
        images: [PLACEHOLDER_IMG],
        unit: r.unit,
        moq: Number(r.moq) || 1,
        priceType: "fixed",
        fixedPrice: Number(r.price) || undefined,
        bulkDiscount: false, sampleAvailable: false,
        leadTime: r.leadTime,
        stockStatus: "In stock",
        pickupLocation: "Malolos, Bulacan",
        deliveryAvailable: true,
        status: "Draft",
        createdAt: Date.now(), updatedAt: Date.now(),
        views: 0, quoteRequests: 0,
      };
      saveListing(listing);
    });
    setQuickRows([emptyRow(), emptyRow(), emptyRow()]);
    setShowQuick(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-lg">My Listings ({listings.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowQuick((s) => !s)} className="text-sm px-3 py-2 rounded border font-semibold">
            {showQuick ? "Hide Quick Add" : "Quick Add Products"}
          </button>
          <Link to="/supplier-portal/products/bulk-upload" className="inline-flex items-center gap-2 border px-3 py-2 rounded-md text-sm font-semibold">
            <Upload size={14} /> Bulk Upload
          </Link>
          <Link to="/supplier-portal/products/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold">
            <Plus size={14} /> Add Product
          </Link>
        </div>
      </div>

      {showQuick && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div>
            <div className="font-semibold text-sm">Quick Add Products</div>
            <div className="text-xs text-muted-foreground">Add multiple products fast. Fields will be saved as drafts.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left px-2 py-2">Product Name</th>
                  <th className="text-left px-2">Category</th>
                  <th className="text-right px-2">Price (₱)</th>
                  <th className="text-left px-2">Unit</th>
                  <th className="text-right px-2">MOQ</th>
                  <th className="text-left px-2">Lead Time</th>
                  <th className="px-2"></th>
                </tr>
              </thead>
              <tbody>
                {quickRows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-1"><input value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} placeholder="Premium Rice 50kg Sack" className="w-full border rounded px-2 py-1.5 text-sm" /></td>
                    <td className="p-1"><input value={r.category} onChange={(e) => updateRow(i, { category: e.target.value })} placeholder="Rice & Grains" className="w-full border rounded px-2 py-1.5 text-sm" /></td>
                    <td className="p-1"><input type="number" value={r.price} onChange={(e) => updateRow(i, { price: e.target.value })} placeholder="2450" className="w-24 border rounded px-2 py-1.5 text-sm text-right" /></td>
                    <td className="p-1"><input value={r.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} className="w-20 border rounded px-2 py-1.5 text-sm" /></td>
                    <td className="p-1"><input type="number" value={r.moq} onChange={(e) => updateRow(i, { moq: e.target.value })} className="w-16 border rounded px-2 py-1.5 text-sm text-right" /></td>
                    <td className="p-1"><input value={r.leadTime} onChange={(e) => updateRow(i, { leadTime: e.target.value })} className="w-36 border rounded px-2 py-1.5 text-sm" /></td>
                    <td className="p-1 text-center">
                      <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive" aria-label="Remove row"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={addRow} className="text-sm text-primary font-semibold">+ Add row</button>
            <button onClick={saveQuickRows} className="text-sm px-4 py-2 rounded bg-primary text-primary-foreground font-semibold">Save Products</button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Product</th>
              <th className="text-left px-2">Category</th>
              <th className="text-right px-2">Price</th>
              <th className="text-right px-2">MOQ</th>
              <th className="text-left px-2">Status</th>
              <th className="text-left px-2">Quality</th>
              <th className="text-right px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const q = qualityOf(l);
              return (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={l.images[0]} alt="" className="size-9 rounded object-cover bg-muted" />
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[240px]">{l.name}</div>
                        <div className="text-xs text-muted-foreground">Updated {new Date(l.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 text-xs">{l.category}</td>
                  <td className="px-2 text-right">
                    {l.priceType === "fixed" ? `₱${l.fixedPrice}` : l.priceType === "range" ? `₱${l.minPrice}–${l.maxPrice}` : "Quote"}
                  </td>
                  <td className="px-2 text-right">{l.moq}</td>
                  <td className="px-2"><StatusChip status={l.status} /></td>
                  <td className="px-2"><QualityChip label={q} /></td>
                  <td className="px-4 text-right text-xs whitespace-nowrap">
                    {l.status === "Draft" && (
                      <button onClick={() => updateStatus(l.id, "Pending Review")} className="text-primary font-semibold mr-2">Submit</button>
                    )}
                    {l.status === "Active" && (
                      <button onClick={() => updateStatus(l.id, "Paused")} className="text-muted-foreground mr-2">Pause</button>
                    )}
                    {l.status === "Paused" && (
                      <button onClick={() => updateStatus(l.id, "Active")} className="text-success mr-2">Resume</button>
                    )}
                    <button onClick={() => { const c = duplicateListing(l.id); if (c) navigate({ to: "/supplier-portal/products" }); }} className="text-primary mr-2">Duplicate</button>
                    <button onClick={() => { if (confirm("Delete this listing?")) deleteListing(l.id); }} className="text-destructive">Delete</button>
                  </td>
                </tr>
              );
            })}
            {listings.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {listings.some((l) => l.status === "Needs Changes") && (
        <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
          <div className="font-semibold text-amber-900">Some listings need changes</div>
          {listings.filter((l) => l.status === "Needs Changes").map((l) => (
            <div key={l.id} className="text-amber-800 mt-1">• {l.name}: {l.reviewNotes}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function qualityOf(l: SupplierListing): "Good" | "Fair" | "Needs Details" {
  const checks = [
    l.name.trim().length >= 4,
    !!l.category,
    l.moq > 0,
    l.priceType === "quote" || (l.priceType === "fixed" ? (l.fixedPrice ?? 0) > 0 : !!l.minPrice),
    !!l.images[0],
    l.description.trim().length >= 15,
  ];
  const passed = checks.filter(Boolean).length;
  return passed >= 5 ? "Good" : passed >= 3 ? "Fair" : "Needs Details";
}

function QualityChip({ label }: { label: string }) {
  const cls = label === "Good" ? "bg-success/10 text-success" : label === "Fair" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground";
  return <span className={`chip ${cls} text-[11px]`}>{label}</span>;
}
