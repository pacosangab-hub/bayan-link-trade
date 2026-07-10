import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { updateStatus, useSupplierListings, type SupplierListing } from "@/lib/supplier-listings";
import { StatusChip } from "./supplier-portal.index";
import { Check, X, MessageSquare, ShieldAlert, Star } from "lucide-react";

export const Route = createFileRoute("/admin/product-review")({
  head: () => ({ meta: [{ title: "Product Review — Admin" }] }),
  component: AdminProductReview,
});

function AdminProductReview() {
  const listings = useSupplierListings();
  const pending = listings.filter((l) => l.status === "Pending Review");

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Admin</div>
          <h1 className="font-display text-3xl">Product Review</h1>
          <p className="text-sm text-muted-foreground">{pending.length} listings awaiting approval</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {pending.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
            No listings pending review.
          </div>
        )}
        {pending.map((l) => <ReviewCard key={l.id} listing={l} />)}

        <div className="mt-8">
          <h2 className="font-semibold mb-3">All listings</h2>
          <div className="rounded-lg border bg-card divide-y">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3 text-sm">
                <img src={l.images[0]} className="size-10 rounded object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.supplierName} · {l.industry}</div>
                </div>
                <StatusChip status={l.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ listing }: { listing: SupplierListing }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="rounded-lg border bg-card p-5 flex gap-4">
      <img src={listing.images[0]} className="size-24 rounded object-cover shrink-0" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold">{listing.name}</div>
            <div className="text-xs text-muted-foreground">{listing.supplierName} · {listing.industry} · {listing.category}</div>
          </div>
          <StatusChip status={listing.status} />
        </div>
        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{listing.description}</p>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <Info label="Price" value={listing.priceType === "fixed" ? `₱${listing.fixedPrice}` : listing.priceType === "range" ? `₱${listing.minPrice}–${listing.maxPrice}` : "Quote"} />
          <Info label="MOQ" value={`${listing.moq} ${listing.unit}`} />
          <Info label="Lead" value={listing.leadTime || "—"} />
          <Info label="Location" value={listing.pickupLocation || "—"} />
        </div>
        <div className="mt-3">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for supplier (for request changes)…"
            className="w-full border rounded px-3 py-1.5 text-sm bg-card" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button onClick={() => updateStatus(listing.id, "Active")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-success text-white font-semibold"><Check size={12} /> Approve</button>
          <button onClick={() => updateStatus(listing.id, "Needs Changes", notes || "Please review and update.")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border font-semibold"><MessageSquare size={12} /> Request Changes</button>
          <button onClick={() => updateStatus(listing.id, "Rejected", notes || "Rejected.")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-destructive text-white font-semibold"><X size={12} /> Reject</button>
          <button onClick={() => updateStatus(listing.id, "Active", "Marked as restricted — compliance review passed.")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border font-semibold"><ShieldAlert size={12} /> Mark Restricted</button>
          <button onClick={() => updateStatus(listing.id, "Active", "Featured product.")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border font-semibold"><Star size={12} /> Feature</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/60 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}
