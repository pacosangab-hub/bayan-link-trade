import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useInventoryMap, useMovements, computeStatus, badgeForStatus, defaultRecordFor,
  adjustStock, setStockValue, setTrackingType, markOutOfStock, markInStock, setPaused,
  setLowStockThreshold, setIncoming, saveInventory, getInventory,
  type StockStatus, type StockTrackingType,
} from "@/lib/inventory";
import { useSupplierListings } from "@/lib/supplier-listings";
import { products as MOCK_PRODUCTS } from "@/lib/mock-data";
import { Minus, Plus, Save, History, PackageX, PackageCheck, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/supplier-portal/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Supplier Portal" }] }),
  component: InventoryPage,
});

// Show inventory for supplier's listings AND the demo supplier's mock products.
const DEMO_SUPPLIER_ID = "sup_001";

function InventoryPage() {
  useInventoryMap(); // subscribe
  const listings = useSupplierListings();
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");

  const rows = useMemo(() => {
    const items: { id: string; title: string; category: string; image?: string; supplierId?: string; unitHint?: string }[] = [];
    for (const l of listings) {
      items.push({ id: l.id, title: l.name, category: l.category, image: l.images[0], supplierId: l.supplierId, unitHint: l.unit });
    }
    for (const p of MOCK_PRODUCTS) {
      if (p.supplierId !== DEMO_SUPPLIER_ID) continue;
      items.push({ id: p.id, title: p.title, category: p.category, image: p.image, supplierId: p.supplierId, unitHint: p.unit });
    }
    return items;
  }, [listings]);

  const lowCount = rows.filter((r) => {
    const s = computeStatus(getInventory(r.id, { unit: r.unitHint, supplierId: r.supplierId }));
    return s === "Low Stock";
  }).length;
  const outCount = rows.filter((r) => computeStatus(getInventory(r.id, { unit: r.unitHint, supplierId: r.supplierId })) === "Out of Stock").length;

  function applyBulk() {
    const lines = bulkText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let updated = 0;
    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length < 2) continue;
      const name = parts[0].toLowerCase();
      const qty = parseInt((parts[1].match(/(\d[\d,]*)/)?.[1] ?? "").replace(/,/g, ""), 10);
      if (!isFinite(qty)) continue;
      const match = rows.find((r) => r.title.toLowerCase().includes(name) || name.includes(r.title.toLowerCase()));
      if (!match) continue;
      setStockValue(match.id, qty, "Bulk update");
      updated++;
    }
    if (updated > 0) {
      toast.success(`Updated stock for ${updated} product${updated === 1 ? "" : "s"}`);
      setBulkText("");
    } else {
      toast.error("No matching products found. Format: Product name, quantity");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl">Inventory</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update stock levels, spot low-stock products, and manage availability.
        </p>
        {(lowCount > 0 || outCount > 0) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {lowCount > 0 && <span className="chip bg-amber-100 text-amber-800">{lowCount} low stock</span>}
            {outCount > 0 && <span className="chip bg-destructive/10 text-destructive">{outCount} out of stock</span>}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Product</th>
              <th className="text-right px-2">Available</th>
              <th className="text-right px-2">Reserved</th>
              <th className="text-right px-2">Incoming</th>
              <th className="text-left px-2">Unit</th>
              <th className="text-left px-2">Status</th>
              <th className="text-right px-2">Low alert</th>
              <th className="text-left px-2">Last updated</th>
              <th className="text-right px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <InventoryRow key={r.id} row={r} onHistory={() => setHistoryFor(r.id)} />
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk update */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold">Bulk Update Stock</div>
            <div className="text-xs text-muted-foreground">One product per line: <code>Product name, quantity</code></div>
          </div>
        </div>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={4}
          placeholder={"Premium Rice 50kg Sack, 240 sacks\nDishwashing Liquid 1 Gallon, 120 gallons"}
          className="w-full border rounded-md p-3 text-sm font-mono bg-background"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={applyBulk}
            disabled={!bulkText.trim()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
          >
            <Save size={14} /> Save Stock Updates
          </button>
        </div>
      </div>

      {historyFor && <HistoryDrawer productId={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
}

function InventoryRow({
  row, onHistory,
}: { row: { id: string; title: string; category: string; image?: string; supplierId?: string; unitHint?: string }; onHistory: () => void }) {
  const rec = getInventory(row.id, { unit: row.unitHint, supplierId: row.supplierId });
  const status = computeStatus(rec);
  const badge = badgeForStatus(status);
  const [draft, setDraft] = useState<number | "">(rec.available);
  const dirty = typeof draft === "number" && draft !== rec.available;

  return (
    <tr className="border-b last:border-0 align-middle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {row.image && <img src={row.image} alt="" className="size-9 rounded object-cover bg-muted" />}
          <div className="min-w-0">
            <div className="font-medium truncate max-w-[260px]">{row.title}</div>
            <div className="text-xs text-muted-foreground">{row.category}</div>
          </div>
        </div>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => { adjustStock(row.id, -1, "Quick reduce"); setDraft((v) => (typeof v === "number" ? Math.max(0, v - 1) : v)); }}
            className="size-7 rounded border grid place-items-center hover:bg-muted" aria-label="Reduce"
          ><Minus size={12} /></button>
          <input
            type="number" min={0}
            value={draft}
            onChange={(e) => setDraft(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10)))}
            className="w-20 border rounded px-2 py-1 text-right text-sm"
          />
          <button
            onClick={() => { adjustStock(row.id, 1, "Quick add"); setDraft((v) => (typeof v === "number" ? v + 1 : v)); }}
            className="size-7 rounded border grid place-items-center hover:bg-muted" aria-label="Add"
          ><Plus size={12} /></button>
          {dirty && (
            <button
              onClick={() => { setStockValue(row.id, draft as number, "Manual set"); toast.success("Stock updated"); }}
              className="ml-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1"
            ><Save size={11} /> Save</button>
          )}
        </div>
      </td>
      <td className="px-2 text-right">{rec.reserved}</td>
      <td className="px-2 text-right">
        <input
          type="number" min={0} defaultValue={rec.incoming}
          onBlur={(e) => {
            const v = parseInt(e.target.value, 10);
            if (isFinite(v) && v !== rec.incoming) { setIncoming(row.id, v); toast.success("Incoming updated"); }
          }}
          className="w-16 border rounded px-1.5 py-0.5 text-right text-sm"
        />
      </td>
      <td className="px-2 text-xs text-muted-foreground">{rec.unit}</td>
      <td className="px-2">
        <select
          value={rec.trackingType === "made_to_order" ? "made_to_order"
            : rec.trackingType === "quote_only" ? "quote_only"
            : rec.trackingType === "unlimited" ? "unlimited"
            : rec.paused ? "paused" : "exact"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "paused") setPaused(row.id, true);
            else { setPaused(row.id, false); setTrackingType(row.id, v as StockTrackingType); }
          }}
          className={`text-xs border rounded px-1.5 py-1 ${badge.className}`}
          title={status}
        >
          <option value="exact">Track exact stock</option>
          <option value="made_to_order">Made to Order</option>
          <option value="quote_only">Quote only</option>
          <option value="unlimited">Unlimited</option>
          <option value="paused">Paused</option>
        </select>
      </td>
      <td className="px-2 text-right">
        <input
          type="number" min={0} defaultValue={rec.lowStockThreshold}
          onBlur={(e) => {
            const v = parseInt(e.target.value, 10);
            if (isFinite(v) && v !== rec.lowStockThreshold) { setLowStockThreshold(row.id, v); toast.success("Low-stock alert updated"); }
          }}
          className="w-16 border rounded px-1.5 py-0.5 text-right text-sm"
        />
      </td>
      <td className="px-2 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(rec.lastUpdated)}</td>
      <td className="px-4 text-right whitespace-nowrap">
        {status === "Out of Stock" ? (
          <button onClick={() => { markInStock(row.id, rec.lowStockThreshold + 10); toast.success("Marked in stock"); }}
            className="text-xs text-success font-semibold inline-flex items-center gap-1 mr-3"><PackageCheck size={12} /> Restock</button>
        ) : (
          <button onClick={() => { markOutOfStock(row.id); toast.success("Marked out of stock"); }}
            className="text-xs text-destructive font-semibold inline-flex items-center gap-1 mr-3"><PackageX size={12} /> Sold out</button>
        )}
        {rec.paused ? (
          <button onClick={() => { setPaused(row.id, false); toast.success("Listing resumed"); }}
            className="text-xs text-success font-semibold inline-flex items-center gap-1 mr-3"><Play size={12} /> Resume</button>
        ) : (
          <button onClick={() => { setPaused(row.id, true); toast.success("Listing paused"); }}
            className="text-xs text-muted-foreground inline-flex items-center gap-1 mr-3"><Pause size={12} /> Pause</button>
        )}
        <button onClick={onHistory} className="text-xs text-primary inline-flex items-center gap-1"><History size={12} /> History</button>
      </td>
    </tr>
  );
}

function HistoryDrawer({ productId, onClose }: { productId: string; onClose: () => void }) {
  const movs = useMovements(productId);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background border-l overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Stock History</div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <ul className="divide-y">
          {movs.length === 0 && <li className="p-6 text-sm text-muted-foreground">No movements yet.</li>}
          {movs.map((m) => (
            <li key={m.id} className="p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{prettyType(m.type)}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(m.createdAt)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {m.previousStock} → {m.newStock}
                {m.quantityChange !== 0 && <span className="ml-2 font-medium">({m.quantityChange > 0 ? "+" : ""}{m.quantityChange})</span>}
              </div>
              {m.reason && <div className="text-xs mt-0.5">{m.reason}</div>}
              {m.relatedOrderId && <div className="text-[11px] text-primary mt-0.5">Order {m.relatedOrderId.toUpperCase()}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function prettyType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// re-export types for callers
export type { StockStatus };
// eslint keep saveInventory / defaultRecordFor imported (used by other modules)
void saveInventory; void defaultRecordFor;
