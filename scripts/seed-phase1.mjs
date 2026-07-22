/**
 * Dev seed helper for Phase 1.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 * Never commit secrets. Never expose service role to the browser.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  {
    email: "buyer@psg.local",
    password: process.env.SEED_BUYER_PASSWORD || "ChangeMe-Buyer-1!",
    full_name: "Paco Reyes",
    intended_account_type: "buyer",
  },
  {
    email: "supplier@psg.local",
    password: process.env.SEED_SUPPLIER_PASSWORD || "ChangeMe-Supplier-1!",
    full_name: "Supplier Admin",
    intended_account_type: "supplier",
  },
  {
    email: "admin@psg.local",
    password: process.env.SEED_ADMIN_PASSWORD || "ChangeMe-Admin-1!",
    full_name: "PSG Admin",
    intended_account_type: "buyer",
  },
] as const;

async function ensureUser(entry: (typeof USERS)[number]) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) throw listed.error;
  const existing = listed.data.users.find((u) => u.email === entry.email);
  if (existing) return existing.id;

  const created = await admin.auth.admin.createUser({
    email: entry.email,
    password: entry.password,
    email_confirm: true,
    user_metadata: {
      full_name: entry.full_name,
      intended_account_type: entry.intended_account_type,
    },
  });
  if (created.error) throw created.error;
  return created.data.user.id;
}

async function main() {
  const buyerId = await ensureUser(USERS[0]);
  const supplierId = await ensureUser(USERS[1]);
  const adminId = await ensureUser(USERS[2]);

  // Force admin role only via service role — never via signup metadata.
  await admin.from("user_roles").delete().eq("user_id", adminId);
  const { error: roleErr } = await admin.from("user_roles").insert([
    { user_id: buyerId, role: "buyer" },
    { user_id: supplierId, role: "supplier" },
    { user_id: adminId, role: "super_admin" },
  ]);
  if (roleErr && !/duplicate/i.test(roleErr.message)) throw roleErr;

  console.log(
    JSON.stringify(
      {
        buyerId,
        supplierId,
        adminId,
        note: "Complete onboarding RPCs while authenticated as each user, or insert businesses via service role.",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
