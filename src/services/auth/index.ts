import { supabase } from "@/integrations/supabase/client";
import { fetchMyAuthContext, touchLastSignIn } from "@/repositories/auth-context";
import {
  rpcCompleteBuyerOnboarding,
  rpcCompleteSupplierOnboarding,
  rpcUpdateMyProfile,
  rpcUpsertBusinessAddress,
} from "@/repositories/businesses";
import type { AuthContext } from "@/types/auth";
import { mapRolesToAuthRole } from "@/types/auth";
import {
  buyerOnboardingInputSchema,
  signInInputSchema,
  signUpInputSchema,
  supplierOnboardingInputSchema,
  updateProfileInputSchema,
  upsertAddressInputSchema,
  type BuyerOnboardingInput,
  type SignInInput,
  type SignUpInput,
  type SupplierOnboardingInput,
  type UpdateProfileInput,
  type UpsertAddressInput,
} from "@/validators/auth";
import type { AuthUser } from "@/lib/auth-store";

export function authContextToUser(ctx: AuthContext, emailFallback = ""): AuthUser {
  const primaryBusiness = ctx.businesses[0];
  return {
    id: ctx.user_id,
    email: ctx.profile?.email || emailFallback,
    fullName: ctx.profile?.full_name || emailFallback || "PSG User",
    role: mapRolesToAuthRole(ctx.roles),
    businessName: primaryBusiness?.business_name || "",
    source: "supabase",
    roles: ctx.roles,
    permissions: ctx.permissions,
    businesses: ctx.businesses,
    accountStatus: ctx.profile?.account_status ?? "active",
    onboardingCompletedAt: ctx.profile?.onboarding_completed_at ?? null,
  };
}

export async function hydrateSessionUser(emailFallback = ""): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  try {
    await touchLastSignIn();
  } catch {
    // Migration may not be applied yet; still try context.
  }
  const ctx = await fetchMyAuthContext();
  if (!ctx) {
    // Fallback when Phase 1 RPC is not yet migrated — never elevate to admin.
    const meta = data.session.user.user_metadata ?? {};
    const intended = String(meta.intended_account_type || meta.role || "buyer");
    const role =
      intended === "supplier" || intended === "both" || intended === "buyer"
        ? (intended as AuthUser["role"])
        : "buyer";
    return {
      id: data.session.user.id,
      email: data.session.user.email || emailFallback,
      fullName: String(meta.full_name || data.session.user.email || "PSG User"),
      role: role === "admin" ? "buyer" : role,
      businessName: String(meta.business_name || ""),
      source: "supabase",
      roles: role === "both" ? ["buyer", "supplier"] : [role === "supplier" ? "supplier" : "buyer"],
      permissions: [],
      businesses: [],
      accountStatus: "active",
      onboardingCompletedAt: null,
    };
  }
  if (ctx.profile?.account_status === "suspended") {
    await supabase.auth.signOut();
    throw new Error("Your account is suspended. Contact PSG support.");
  }
  return authContextToUser(ctx, data.session.user.email || emailFallback);
}

export async function signInWithPassword(input: SignInInput): Promise<AuthUser> {
  const parsed = signInInputSchema.parse(input);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });
  if (error) throw error;
  if (!data.user) throw new Error("Login failed");
  const user = await hydrateSessionUser(parsed.email);
  if (!user) throw new Error("Unable to load profile");
  return user;
}

export async function signUpWithPassword(input: SignUpInput): Promise<AuthUser> {
  const parsed = signUpInputSchema.parse(input);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: {
        full_name: parsed.fullName,
        // Never send privileged roles. Backend ignores admin elevation.
        intended_account_type: parsed.intendedAccountType,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Signup failed");

  // If email confirmation is required there may be no session yet.
  if (!data.session) {
    return {
      id: data.user.id,
      email: parsed.email,
      fullName: parsed.fullName,
      role: parsed.intendedAccountType,
      businessName: "",
      source: "supabase",
      roles:
        parsed.intendedAccountType === "both"
          ? ["buyer", "supplier"]
          : [parsed.intendedAccountType],
      permissions: [],
      businesses: [],
      accountStatus: "active",
      onboardingCompletedAt: null,
      awaitingEmailConfirmation: true,
    };
  }

  const user = await hydrateSessionUser(parsed.email);
  if (!user) throw new Error("Unable to load profile after signup");
  return user;
}

export async function completeBuyerOnboarding(input: BuyerOnboardingInput): Promise<string> {
  const parsed = buyerOnboardingInputSchema.parse(input);
  return rpcCompleteBuyerOnboarding(parsed);
}

export async function completeSupplierOnboarding(input: SupplierOnboardingInput): Promise<string> {
  const parsed = supplierOnboardingInputSchema.parse(input);
  return rpcCompleteSupplierOnboarding(parsed);
}

export async function updateMyProfile(input: UpdateProfileInput) {
  const parsed = updateProfileInputSchema.parse(input);
  return rpcUpdateMyProfile(parsed);
}

export async function upsertBusinessAddress(input: UpsertAddressInput) {
  const parsed = upsertAddressInputSchema.parse(input);
  return rpcUpsertBusinessAddress(parsed);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
  });
  if (error) throw error;
}

export async function signOutEverywhere(): Promise<void> {
  await supabase.auth.signOut();
}
