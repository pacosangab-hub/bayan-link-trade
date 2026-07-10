import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { duplicateListing, updateStatus, useSupplierListings } from "@/lib/supplier-listings";
import { StatusChip } from "./supplier-portal.index";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/products/")({
  component: MyListings,
});

function MyListings() {
  const listings = useSupplierListings();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-lg">Listings ({listings.length})</h2>
        <div className="flex gap-2">
          <Link to="/supplier-portal/products/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold">
            <Plus size={14} /> Add Product
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Product</th>
              <th className="text-right px-2">Price</th>
              <th className="text-right px-2">MOQ</th>
              <th className="text-left px-2">Status</th>
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
                      <div className="font-medium truncate max-w-[280px]">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{l.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 text-right">
                  {l.priceType === "fixed" ? `₱${l.fixedPrice}` : l.priceType === "range" ? `₱${l.minPrice}–${l.maxPrice}` : "Quote"}
                </td>
                <td className="px-2 text-right">{l.moq}</td>
                <td className="px-2"><StatusChip status={l.status} /></td>
                <td className="px-4 text-right text-xs whitespace-nowrap">
                  <button onClick={() => navigate({ to: "/supplier-portal/products/new" })} className="text-primary font-semibold mr-3">Edit</button>
                  <button onClick={() => duplicateListing(l.id)} className="text-primary mr-3">Duplicate</button>
                  {l.status === "Active" ? (
                    <button onClick={() => updateStatus(l.id, "Paused")} className="text-muted-foreground">Pause</button>
                  ) : l.status === "Paused" ? (
                    <button onClick={() => updateStatus(l.id, "Active")} className="text-success">Resume</button>
                  ) : l.status === "Draft" ? (
                    <button onClick={() => updateStatus(l.id, "Pending Review")} className="text-primary font-semibold">Submit</button>
                  ) : null}
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
