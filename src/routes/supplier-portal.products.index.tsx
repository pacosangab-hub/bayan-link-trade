import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { deleteListing, duplicateListing, updateStatus, useSupplierListings } from "@/lib/supplier-listings";
import { StatusChip } from "./supplier-portal.index";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/products/")({
  component: MyProducts,
});

function MyProducts() {
  const listings = useSupplierListings();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">My Products ({listings.length})</h2>
        <Link to="/supplier-portal/products/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold">
          <Plus size={14} /> Add Product
        </Link>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Product</th>
              <th className="text-left px-2">Category</th>
              <th className="text-right px-2">Price</th>
              <th className="text-right px-2">MOQ</th>
              <th className="text-left px-2">Status</th>
              <th className="text-right px-2">Views</th>
              <th className="text-right px-2">Quotes</th>
              <th className="text-right px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
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
                <td className="px-2 text-right">{l.views}</td>
                <td className="px-2 text-right">{l.quoteRequests}</td>
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
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No products yet.</td></tr>
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
