// Data access for marketplace entities.
// Prefers Supabase Phase 2 RPCs; falls back to mock/localStorage so Lovable demos keep working.

import { useQuery } from "@tanstack/react-query";
import {
  suppliers as MOCK_SUPPLIERS,
  products as MOCK_PRODUCTS,
  categories as MOCK_CATEGORIES,
  orders as MOCK_ORDERS,
  productById,
} from "@/lib/mock-data";
import { getAllRfqs, getRfq } from "@/lib/rfq-store";
import { useSupplierListings, listingToProduct, getListing } from "@/lib/supplier-listings";
import type { Product, Supplier, RFQ } from "@/lib/mock-data";
import {
  getProductDetail,
  listCategories,
  listMarketplaceProducts,
  listMySupplierProducts,
} from "@/services/products";

export function adaptSupplier(s: Supplier): Supplier {
  return s;
}
export function adaptProduct(p: Product): Product {
  return p;
}
export function adaptRfq(r: RFQ): RFQ {
  return r;
}

function supplierAsBusiness(s: Supplier) {
  return {
    id: s.id,
    business_name: s.name,
    verification_status: s.verified ? "verified" : "pending",
    rating: s.rating,
    location: s.location,
    industry: s.categories?.[0] ?? "",
  };
}

function mockProductsPayload() {
  return MOCK_PRODUCTS.map((product) => {
    const s = MOCK_SUPPLIERS.find((x) => x.id === product.supplierId);
    return { product, supplier: s ? supplierAsBusiness(s) : null };
  });
}

export function useProducts() {
  const listings = useSupplierListings();
  return useQuery({
    queryKey: ["products", "marketplace", listings.length, listings.map((l) => `${l.id}:${l.status}`).join("|")],
    queryFn: async () => {
      try {
        const remote = await listMarketplaceProducts();
        if (remote.length > 0) {
          return remote.map((row) => ({
            product: row.product,
            supplier: {
              id: row.supplier.id,
              business_name: row.supplier.business_name,
              verification_status: row.supplier.verification_status,
              rating: row.supplier.rating ?? 0,
              location: row.supplier.location,
              industry: row.supplier.industry,
            },
          }));
        }
      } catch {
        /* fall through to local demo data */
      }

      const uploaded = listings
        .filter((l) => l.status === "Active")
        .map((l) => {
          const p = listingToProduct(l) as Product;
          const s = MOCK_SUPPLIERS.find((x) => x.id === p.supplierId);
          return { product: p, supplier: s ? supplierAsBusiness(s) : null };
        });
      return [...uploaded, ...mockProductsPayload()];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async () => {
      try {
        const remote = await getProductDetail(id);
        if (remote) {
          return {
            product: remote.product,
            supplier: {
              id: remote.supplier.id,
              name: remote.supplier.business_name,
              verified: remote.supplier.verification_status === "verified",
              location: remote.supplier.location,
              rating: remote.supplier.rating ?? 0,
            },
          };
        }
      } catch {
        /* local fallback */
      }

      const listing = getListing(id);
      if (listing) {
        const product = listingToProduct(listing) as Product;
        const supplier = MOCK_SUPPLIERS.find((s) => s.id === product.supplierId) ?? null;
        return { product, supplier };
      }

      const product = productById(id) ?? MOCK_PRODUCTS.find((p) => p.id === id);
      if (!product) return null;
      const supplier = MOCK_SUPPLIERS.find((s) => s.id === product.supplierId) ?? null;
      return { product, supplier };
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => MOCK_SUPPLIERS,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["supplier", id],
    enabled: !!id,
    queryFn: async () => MOCK_SUPPLIERS.find((s) => s.id === id) ?? null,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const rows = await listCategories();
        if (rows.length > 0) {
          return rows.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon ?? "🏷️",
          }));
        }
      } catch {
        /* mock fallback */
      }
      return MOCK_CATEGORIES.map((c, i) => ({ id: `cat_${i}`, name: c.name, icon: c.icon }));
    },
  });
}

export function useMySupplierProducts() {
  return useQuery({
    queryKey: ["my-supplier-products"],
    queryFn: async () => {
      try {
        return await listMySupplierProducts();
      } catch {
        return [];
      }
    },
  });
}

export function useRfqs() {
  return useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => getAllRfqs(),
  });
}

export function useRfq(id: string) {
  return useQuery({
    queryKey: ["rfq", id],
    enabled: !!id,
    queryFn: async () => getRfq(id) ?? null,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => MOCK_ORDERS,
  });
}

export function useCreateRfq() {
  return { mutateAsync: async (_input: unknown) => ({}), isPending: false };
}
export function useSubmitRfqQuote() {
  return { mutateAsync: async (_input: unknown) => ({}), isPending: false };
}
