# Phase 1 — Auth / Profiles / Roles / Businesses

**Status:** Implemented in code (apply migration to Supabase project to activate RPCs).  
**Branch:** `cursor/psg-phase1-auth-b12a`  
**UI:** No redesign — existing Lovable screens wired.

## What shipped

### Database (`supabase/migrations/20260722050000_phase1_auth_roles_permissions.sql`)

- Extended `app_role` with `super_admin`, `support`, `finance_admin`, `verification_admin`, `operations_admin`
- `account_status`, `intended_account_type` on `profiles`
- `admin_permissions` + `user_admin_permissions`
- `buyer_profiles`, `business_addresses`
- Hardened `handle_new_user` — **never assigns admin from client metadata**
- RPCs: `get_my_auth_context`, `touch_last_sign_in`, `complete_buyer_onboarding`, `complete_supplier_onboarding`, `update_my_profile`, `upsert_business_address`, `write_audit_log`, `admin_set_user_roles`, `admin_set_user_permissions`, `admin_set_account_status`
- Restored `EXECUTE` on RLS helper functions (`has_role`, etc.)
- Audit log inserts restricted to definer RPC

### App layer

- `src/types/auth.ts`, `src/validators/auth.ts`
- `src/repositories/*`, `src/services/auth/*`
- Auth store loads DB roles/permissions for Supabase users
- Session sync in root layout
- Login / signup / `/auth` / onboarding / account profile / RequireAuth wired
- Demo login gated to DEV / `VITE_ENABLE_DEMO_AUTH`

### Tests / seed

- `npm run test` — role mapping + signup validation + permissions
- `supabase/seed/phase1_auth.md`, `scripts/seed-phase1.mjs`

## Apply before using RPCs

1. Push/apply migration to the Lovable Supabase project.
2. Seed admin via service role (`scripts/seed-phase1.mjs`) — never via signup.
3. Confirm `get_my_auth_context` returns roles for a test user.

## Explicitly out of Phase 1

Products, cart, checkout, RFQ, payments, delivery tracking, live admin metrics.
