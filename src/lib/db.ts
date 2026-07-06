// Mock-data layer (previously Supabase-backed).
// Returns local mock data via react-query so all consuming components keep working.

import { useQuery } from "@tanstack/react-query";
import {
  suppliers as MOCK_SUPPLIERS,
  products as MOCK_PRODUCTS,
  categories as MOCK_CATEGORIES,
  orders as MOCK_ORDERS,
} from "@/lib/mock-data";
import { getAllRfqs, getRfq } from "@/lib/rfq-store";
import type { Product, Supplier, RFQ } from "@/lib/mock-data";

// ---------- adapters (kept for backward-compat with any external imports)
export function adaptSupplier(s: any): Supplier {
  return s as Supplier;
}
export function adaptProduct(p: any): Product {
  return p as Product;
}
export function adaptRfq(r: any): RFQ {
  return r as RFQ;
}

// ---------- helpers
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

// ---------- queries
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return MOCK_PRODUCTS.map((product) => {
        const s = MOCK_SUPPLIERS.find((x) => x.id === product.supplierId);
        return { product, supplier: s ? supplierAsBusiness(s) : null };
      });
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async () => {
      const product = MOCK_PRODUCTS.find((p) => p.id === id);
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
    queryFn: async () =>
      MOCK_CATEGORIES.map((c, i) => ({ id: `cat_${i}`, name: c.name, icon: c.icon })),
  });
}

export function useRfqs() {
  return useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => listRfqs(),
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

// ---------- no-op mutations kept for compatibility
export function useCreateRfq() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as any;
}
export function useSubmitRfqQuote() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as any;
}
