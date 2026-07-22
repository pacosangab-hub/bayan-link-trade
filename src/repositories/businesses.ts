import { supabase } from "@/integrations/supabase/client";
import type {
  BuyerOnboardingInput,
  SupplierOnboardingInput,
  UpdateProfileInput,
  UpsertAddressInput,
} from "@/validators/auth";

export async function rpcCompleteBuyerOnboarding(input: BuyerOnboardingInput): Promise<string> {
  const { data, error } = await supabase.rpc("complete_buyer_onboarding", {
    _business_name: input.businessName,
    _business_type: input.businessType ?? undefined,
    _industry: input.industry ?? undefined,
    _location: input.location ?? undefined,
    _region: input.region ?? undefined,
    _contact_phone: input.contactPhone ?? undefined,
    _contact_email: input.contactEmail || undefined,
    _address_line1: input.addressLine1 ?? undefined,
    _typical_categories: input.typicalCategories ?? [],
    _sourcing_cadence: input.sourcingCadence ?? undefined,
    _preferred_supplier_locations: input.preferredSupplierLocations ?? undefined,
    _branch_count: input.branchCount ?? undefined,
  });
  if (error) throw error;
  return String(data);
}

export async function rpcCompleteSupplierOnboarding(input: SupplierOnboardingInput): Promise<string> {
  const { data, error } = await supabase.rpc("complete_supplier_onboarding", {
    _business_name: input.businessName,
    _business_type: input.businessType ?? undefined,
    _industry: input.industry ?? undefined,
    _location: input.location ?? undefined,
    _region: input.region ?? undefined,
    _contact_phone: input.contactPhone ?? undefined,
    _contact_email: input.contactEmail || undefined,
    _description: input.description ?? undefined,
    _supplier_type: input.supplierType ?? undefined,
    _years_operating: input.yearsOperating ?? undefined,
    _service_regions: input.serviceRegions ?? [],
    _address_line1: input.addressLine1 ?? undefined,
  });
  if (error) throw error;
  return String(data);
}

export async function rpcUpdateMyProfile(input: UpdateProfileInput) {
  const { data, error } = await supabase.rpc("update_my_profile", {
    _full_name: input.fullName ?? undefined,
    _phone: input.phone ?? undefined,
    _avatar_url: input.avatarUrl || undefined,
  });
  if (error) throw error;
  return data;
}

export async function rpcUpsertBusinessAddress(input: UpsertAddressInput): Promise<string> {
  const { data, error } = await supabase.rpc("upsert_business_address", {
    _business_id: input.businessId,
    _label: input.label,
    _line1: input.line1,
    _contact_name: input.contactName ?? undefined,
    _phone: input.phone ?? undefined,
    _line2: input.line2 ?? undefined,
    _city: input.city ?? undefined,
    _region: input.region ?? undefined,
    _postal_code: input.postalCode ?? undefined,
    _is_default: input.isDefault ?? false,
    _address_id: input.addressId ?? undefined,
  });
  if (error) throw error;
  return String(data);
}
