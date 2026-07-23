// Lets a signed-in user set their own account type (buyer / supplier / both).
// admin and super_admin can NEVER be self-assigned. "both" = buyer + supplier.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SelfRole = "buyer" | "supplier" | "both";
const ALLOWED: SelfRole[] = ["buyer", "supplier", "both"];
type DbRole = "buyer" | "supplier";

export const setSelfRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { role: SelfRole }) => {
    if (!input || !ALLOWED.includes(input.role)) throw new Error("Invalid role");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const targets: DbRole[] =
      data.role === "both" ? ["buyer", "supplier"] : [data.role];

    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", context.userId)
      .in("role", ["buyer", "supplier"]);

    const rows = targets.map((r) => ({ user_id: context.userId, role: r }));
    const { error } = await supabaseAdmin.from("user_roles").insert(rows);
    if (error && !/duplicate/i.test(error.message)) throw error;
    return { ok: true, role: data.role };
  });
