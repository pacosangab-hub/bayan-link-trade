# Phase 1 auth seed

Create three Auth users in the Supabase project (Dashboard → Authentication → Users):

| Email | Password (dev only) | Intended type |
|-------|---------------------|---------------|
| `buyer@psg.local` | set locally | buyer |
| `supplier@psg.local` | set locally | supplier |
| `admin@psg.local` | set locally | n/a (assigned in SQL) |

Then run (replacing UUIDs):

```sql
-- Ensure non-admin roles from signup are present for buyer/supplier
INSERT INTO public.user_roles (user_id, role) VALUES
  ('BUYER_UUID', 'buyer'),
  ('SUPPLIER_UUID', 'supplier')
ON CONFLICT DO NOTHING;

-- Admin must be granted only via secure SQL / admin_set_user_roles — never signup metadata
DELETE FROM public.user_roles WHERE user_id = 'ADMIN_UUID';
INSERT INTO public.user_roles (user_id, role) VALUES ('ADMIN_UUID', 'super_admin');

SELECT public.complete_buyer_onboarding(
  'Lola Nena''s Carinderia Group', 'Carinderia', 'Food Service',
  'Quezon City', 'NCR', '+639175550142', 'buyer@psg.local',
  '14 Roces Ave, Project 8, Quezon City', ARRAY['Rice & Grains','Vegetables'],
  'Weekly', 'NCR', 8
); -- run as buyer session

SELECT public.complete_supplier_onboarding(
  'Bulacan Grain & Rice Mills Inc.', 'Manufacturer', 'Agriculture',
  'Malolos', 'Region III', '+639175550000', 'supplier@psg.local',
  'Family-run rice mill', 'Manufacturer', 14, ARRAY['Region III','NCR'],
  'Malolos, Bulacan'
); -- run as supplier session
```

Or use `node scripts/seed-phase1.mjs` with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set in the environment (never commit the key).
