import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  duplicateListing,
  mergeSupplierListings,
  updateStatus,
  useSupplierListings,
  type ListingStatus,
} from "@/lib/supplier-listings";
import { StatusChip } from "./supplier-portal.index";
import { useInventoryMap, getInventory, computeStatus, badgeForStatus } from "@/lib/inventory";
import { useMySupplierProducts } from "@/lib/db";
import { Plus, Upload, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/supplier-portal/products/")({
  component: MyListings,
});

type Filter = "All" | ListingStatus | "Out of Stock";
const FILTERS: Filter[] = ["All", "Active", "Pending Review", "Draft", "Paused", "Out of Stock"];

function MyListings() {
  const localListings = useSupplierListings();
  const remoteQuery = useMySupplierProducts();
  const listings = useMemo(
    () => mergeSupplierListings(localListings, remoteQuery.data ?? []),
    [localListings, remoteQuery.data],
  );
  useInventoryMap();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return listings;
    if (filter === "Out of Stock") {
      return listings.filter((l) => computeStatus(getInventory(l.id, { unit: l.unit, supplierId: l.supplierId })) === "Out of Stock");
    }
    return listings.filter((l) => l.status === filter);
  }, [listings, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-lg">Your Products ({listings.length})</h2>
        <div className="flex gap-2">
          <Link to="/supplier-portal/products/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold">
            <Plus size={14} /> Add Product
          </Link>
          <button
            onClick={() => navigate({ to: "/supplier-portal/products/new" })}
            className="inline-flex items-center gap-2 border bg-card px-3 py-2 rounded-md text-sm font-semibold"
          >
            <Upload size={14} /> Bulk Upload
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Product</th>
              <th className="text-right px-2">Price</th>
              <th className="text-right px-2">MOQ</th>
              <th className="text-left px-2">Stock</th>
              <th className="text-left px-2">Listing</th>
              <th className="text-right px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const inv = getInventory(l.id, { unit: l.unit, supplierId: l.supplierId });
              const stockStatus = computeStatus(inv);
              const stockBadge = badgeForStatus(stockStatus);
              return (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={l.images[0]} alt="" className="size-9 rounded object-cover bg-muted" />
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[280px]">{l.name}</div>
                        <div className="text-xs text-muted-foreground">{l.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 text-right">
                    {l.priceType === "fixed" ? `₱${l.fixedPrice}` : l.priceType === "range" ? `₱${l.minPrice}–${l.maxPrice}` : "Quote"}
                  </td>
                  <td className="px-2 text-right">{l.moq}</td>
                  <td className="px-2"><span className={`chip text-[10px] ${stockBadge.className}`}>{stockStatus}</span></td>
                  <td className="px-2"><StatusChip status={l.status} /></td>
                  <td className="px-4 text-right text-xs whitespace-nowrap">
                    <button onClick={() => navigate({ to: "/supplier-portal/products/new" })} className="text-primary font-semibold mr-3">Edit</button>
                    <button onClick={() => duplicateListing(l.id)} className="text-primary mr-3">Duplicate</button>
                    {l.status === "Active" ? (
                      <button onClick={() => updateStatus(l.id, "Paused")} className="text-muted-foreground mr-3">Pause</button>
                    ) : l.status === "Paused" ? (
                      <button onClick={() => updateStatus(l.id, "Active")} className="text-success mr-3">Resume</button>
                    ) : l.status === "Draft" ? (
                      <button onClick={() => updateStatus(l.id, "Pending Review")} className="text-primary font-semibold mr-3">Submit</button>
                    ) : null}
                    <Link to="/products/$id" params={{ id: l.id }} target="_blank" className="text-primary inline-flex items-center gap-1">
                      <ExternalLink size={11} /> Preview
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No products match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
