// Supabase-backed data layer for PSG.
// Adapts DB rows to the shapes used by existing UI components (mock-data types).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Supplier, RFQ, RFQStatus } from "@/lib/mock-data";

// -------- image fallbacks (mock-data still holds Unsplash URLs)
const IMG = {
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=70",
  fish: "https://images.unsplash.com/photo-1535473895227-bdecb20fb157?auto=format&fit=crop&w=800&q=70",
  tomato: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=800&q=70",
  coffee: "https://images.unsplash.com/photo-1442550528053-c431ecb55509?auto=format&fit=crop&w=800&q=70",
  bottle: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=70",
  paper: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=70",
  cement: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=70",
  meds: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=70",
  factory: "https://images.unsplash.com/photo-1565793979206-6471901eba0c?auto=format&fit=crop&w=800&q=70",
  farm: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=70",
  warehouse: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=70",
};

function pickImage(category?: string | null): string {
  const c = (category || "").toLowerCase();
  if (c.includes("rice") || c.includes("grain") || c.includes("food")) return IMG.rice;
  if (c.includes("sea")) return IMG.fish;
  if (c.includes("veg")) return IMG.tomato;
  if (c.includes("coffee") || c.includes("bev")) return IMG.coffee;
  if (c.includes("pack") || c.includes("bottle")) return IMG.bottle;
  if (c.includes("paper") || c.includes("dispos")) return IMG.paper;
  if (c.includes("const") || c.includes("cement")) return IMG.cement;
  if (c.includes("pharma") || c.includes("med")) return IMG.meds;
  return IMG.warehouse;
}

// -------- adapters (DB row -> legacy UI types)

export function adaptSupplier(b: any): Supplier {
  const sp = b.supplier_profiles?.[0] ?? b.supplier_profile ?? null;
  return {
    id: b.id,
    name: b.business_name,
    type: (sp?.supplier_type as any) || "Manufacturer",
    location: b.location || "",
    region: b.region || "",
    verified: b.verification_status === "verified",
    goldSupplier: !!sp?.is_gold_supplier,
    yearsOperating: sp?.years_operating ?? 0,
    rating: Number(b.rating ?? sp?.rating ?? 0),
    reviews: sp?.completed_orders ?? 0,
    transactions: sp?.completed_orders ?? 0,
    repeatBuyers: 0,
    responseTime: sp?.response_time || "—",
    leadTime: "2–4 days",
    permits: sp?.verification_badges ?? [],
    description: b.description || "",
    cover: pickImage(b.industry),
    categories: sp?.service_regions ?? [],
  };
}

export function adaptProduct(p: any, category?: any): Product {
  const price = Number(p.fixed_price ?? p.price_min ?? 0);
  return {
    id: p.id,
    supplierId: p.supplier_business_id,
    title: p.title,
    category: category?.name || "",
    unit: p.unit || "unit",
    moq: p.minimum_order_quantity || 1,
    pricePhp: price,
    tierPricing: [{ qty: p.minimum_order_quantity || 1, price }],
    leadTimeDays: parseInt((p.lead_time || "").match(/\d+/)?.[0] || "3"),
    image: (p.images && p.images[0]) || pickImage(category?.name),
    stock: p.stock_status === "in_stock" ? "In stock" : p.stock_status?.replace(/_/g, " ") || "",
    origin: p.location || "",
    description: p.description || "",
  };
}

export function adaptRfq(r: any, buyer?: any, category?: any): RFQ {
  const statusMap: Record<string, RFQStatus> = {
    draft: "Draft", open: "Open", receiving_quotes: "Receiving Quotes",
    awaiting_decision: "Awaiting Decision", supplier_selected: "Supplier Selected",
    order_created: "Order Created", completed: "Completed", closed: "Closed", expired: "Closed",
  };
  return {
    id: r.id,
    buyer: buyer?.business_name || "Buyer",
    buyerType: buyer?.industry || "",
    buyerVerified: buyer?.verification_status === "verified",
    title: r.title,
    category: category?.name || "",
    qty: `${r.quantity || 0} ${r.unit || ""}`,
    unit: r.unit,
    recurring: !!r.recurring_type,
    budgetPhp: r.target_budget ? `₱${Number(r.target_budget).toLocaleString()}` : "Open",
    deliverBy: r.needed_by || "—",
    deliveryLocation: r.delivery_location,
    region: r.region || "",
    postedAgo: r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
    description: r.description || "",
    responses: r.quotes_count || 0,
    status: statusMap[r.status] || "Open",
    nextAction: r.quotes_count > 0 ? `${r.quotes_count} quotes — Review` : "Waiting for quotes",
    quotes: [],
  };
}

// -------- query hooks

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), businesses:supplier_business_id(id, business_name, verification_status, rating)")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        product: adaptProduct(p, p.categories),
        supplier: p.businesses,
      }));
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), businesses:supplier_business_id(*, supplier_profiles(*))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        product: adaptProduct(data, (data as any).categories),
        supplier: adaptSupplier((data as any).businesses),
      };
    },
    enabled: !!id,
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*, supplier_profiles(*)")
        .eq("is_supplier", true)
        .order("is_featured", { ascending: false });
      if (error) throw error;
      return (data || []).map(adaptSupplier);
    },
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*, supplier_profiles(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? adaptSupplier(data) : null;
    },
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRfqs() {
  return useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfqs")
        .select("*, categories(name), businesses:buyer_business_id(business_name, industry, verification_status)")
        .neq("status", "draft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => adaptRfq(r, r.businesses, r.categories));
    },
  });
}

export function useRfq(id: string) {
  return useQuery({
    queryKey: ["rfq", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfqs")
        .select("*, categories(name), businesses:buyer_business_id(business_name, industry, verification_status), rfq_quotes(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const base = adaptRfq(data as any, (data as any).businesses, (data as any).categories);
      base.quotes = ((data as any).rfq_quotes || []).map((q: any) => ({
        supplierId: q.supplier_business_id,
        pricePhp: Number(q.unit_price ?? q.total_price ?? 0),
        moq: q.minimum_order_quantity || 1,
        leadTimeDays: parseInt((q.lead_time || "").match(/\d+/)?.[0] || "3"),
        deliveryFee: Number(q.delivery_fee || 0),
        paymentTerms: q.payment_terms || "",
        note: q.message || "",
      }));
      return base;
    },
    enabled: !!id,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, buyer:buyer_business_id(business_name), supplier:supplier_business_id(business_name, location)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

// -------- mutations

export function useCreateRfq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      buyer_business_id: string;
      category_id?: string;
      title: string;
      description?: string;
      quantity: number;
      unit: string;
      target_budget?: number;
      delivery_location?: string;
      region?: string;
      needed_by?: string;
      recurring_type?: string;
      requirements?: string;
    }) => {
      const { data, error } = await supabase.from("rfqs").insert({ ...input, status: "open" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rfqs"] }),
  });
}

export function useSubmitRfqQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      rfq_id: string;
      supplier_business_id: string;
      unit_price?: number;
      total_price?: number;
      minimum_order_quantity?: number;
      lead_time?: string;
      delivery_fee?: number;
      payment_terms?: string;
      message?: string;
    }) => {
      const { data, error } = await supabase.from("rfq_quotes").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["rfq", v.rfq_id] });
      qc.invalidateQueries({ queryKey: ["rfqs"] });
    },
  });
}
