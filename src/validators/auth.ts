import { z } from "zod";

export const intendedAccountTypeSchema = z.enum(["buyer", "supplier", "both"]);

export const signUpInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().trim().min(1).max(120),
  intendedAccountType: intendedAccountTypeSchema,
});

export const signInInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateProfileInputSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const buyerOnboardingInputSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  businessType: z.string().trim().max(100).optional(),
  industry: z.string().trim().max(100).optional(),
  location: z.string().trim().max(120).optional(),
  region: z.string().trim().max(80).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().trim().max(300).optional(),
  typicalCategories: z.array(z.string()).optional(),
  sourcingCadence: z.string().trim().max(80).optional(),
  preferredSupplierLocations: z.string().trim().max(200).optional(),
  branchCount: z.number().int().min(0).max(10000).optional(),
});

export const supplierOnboardingInputSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  businessType: z.string().trim().max(100).optional(),
  industry: z.string().trim().max(100).optional(),
  location: z.string().trim().max(120).optional(),
  region: z.string().trim().max(80).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional(),
  supplierType: z.string().trim().max(100).optional(),
  yearsOperating: z.number().int().min(0).max(200).optional(),
  serviceRegions: z.array(z.string()).optional(),
  addressLine1: z.string().trim().max(300).optional(),
});

export const upsertAddressInputSchema = z.object({
  businessId: z.string().uuid(),
  addressId: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(80),
  line1: z.string().trim().min(1).max(300),
  contactName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  line2: z.string().trim().max(300).optional(),
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type BuyerOnboardingInput = z.infer<typeof buyerOnboardingInputSchema>;
export type SupplierOnboardingInput = z.infer<typeof supplierOnboardingInputSchema>;
export type UpsertAddressInput = z.infer<typeof upsertAddressInputSchema>;
