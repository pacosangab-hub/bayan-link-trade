// Lets a signed-in user set their own account type (buyer / supplier / both).
// admin and super_admin can NEVER be self-assigned.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SelfRole = "buyer" | "supplier" | "both";
const ALLOWED: SelfRole[] = ["buyer", "supplier", "both"];

export const setSelfRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { role: SelfRole }) => {
    if (!input || !ALLOWED.includes(input.role)) throw new Error("Invalid role");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Only touch this user's rows; never grant admin/super_admin.
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", context.userId)
      .in("role", ["buyer", "supplier", "both"]);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: data.role });
    if (error && !/duplicate/i.test(error.message)) throw error;
    return { ok: true, role: data.role };
  });
