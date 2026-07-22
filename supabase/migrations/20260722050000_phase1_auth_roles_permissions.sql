-- ============================================================
-- Phase 1 — Auth, profiles, roles, admin permissions, businesses
-- Additive migration. Does not redesign the frontend.
-- ============================================================

-- ---------- Extend app_role ----------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'verification_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_admin';

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'pending_verification', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public.intended_account_type AS ENUM ('buyer', 'supplier', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- Harden profiles ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS intended_account_type public.intended_account_type,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

COMMENT ON TABLE public.profiles IS 'Public user profile. Roles live in user_roles; never trust client role claims.';

-- ---------- Admin permission catalog ----------
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_admin_permissions_user ON public.user_admin_permissions(user_id);

INSERT INTO public.admin_permissions (key, description) VALUES
  ('users.read', 'View user accounts'),
  ('users.manage', 'Suspend/reactivate users and manage account status'),
  ('businesses.read', 'View businesses and supplier profiles'),
  ('businesses.verify', 'Approve/reject supplier verification'),
  ('products.read', 'View products for moderation'),
  ('products.moderate', 'Approve/reject/hide products'),
  ('rfqs.read', 'View RFQs'),
  ('rfqs.manage', 'Manage RFQ exceptions'),
  ('quotes.read', 'View supplier offers/quotes'),
  ('orders.read', 'View orders'),
  ('orders.manage', 'Cancel/freeze orders and resolve exceptions'),
  ('shipments.read', 'View shipments and tracking'),
  ('shipments.manage', 'Manage shipment exceptions'),
  ('payments.read', 'View payments and escrow'),
  ('payments.manage', 'Release/refund protected payments'),
  ('disputes.read', 'View disputes'),
  ('disputes.manage', 'Resolve disputes'),
  ('reviews.moderate', 'Moderate reviews'),
  ('messages.review', 'Review reported conversations with a recorded reason'),
  ('reports.read', 'View platform reports and dashboards'),
  ('audit_logs.read', 'View audit logs'),
  ('platform_settings.manage', 'Manage platform settings')
ON CONFLICT (key) DO NOTHING;

-- ---------- Role helpers (after permission tables exist) ----------
CREATE OR REPLACE FUNCTION public.is_admin_role(_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _role IN (
    'admin'::public.app_role,
    'super_admin'::public.app_role,
    'support'::public.app_role,
    'finance_admin'::public.app_role,
    'verification_admin'::public.app_role,
    'operations_admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND public.is_admin_role(role)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_admin_permissions uap
      JOIN public.admin_permissions ap ON ap.id = uap.permission_id
      WHERE uap.user_id = _user_id AND ap.key = _permission_key
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_business_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_role(public.app_role) TO authenticated;

GRANT SELECT ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_permissions readable authenticated" ON public.admin_permissions;
CREATE POLICY "admin_permissions readable authenticated"
  ON public.admin_permissions FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.user_admin_permissions TO authenticated;
GRANT ALL ON public.user_admin_permissions TO service_role;
ALTER TABLE public.user_admin_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own admin permissions" ON public.user_admin_permissions;
CREATE POLICY "users read own admin permissions"
  ON public.user_admin_permissions FOR SELECT
  USING (auth.uid() = user_id OR public.has_admin_role(auth.uid()));

-- ---------- Buyer profiles ----------
CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  typical_categories TEXT[] DEFAULT '{}',
  sourcing_cadence TEXT,
  preferred_supplier_locations TEXT,
  branch_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.buyer_profiles TO authenticated;
GRANT ALL ON public.buyer_profiles TO service_role;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "buyer_profiles members read" ON public.buyer_profiles;
CREATE POLICY "buyer_profiles members read" ON public.buyer_profiles FOR SELECT
  USING (public.is_business_member(business_id, auth.uid()) OR public.has_admin_role(auth.uid()));
DROP POLICY IF EXISTS "buyer_profiles members write" ON public.buyer_profiles;
CREATE POLICY "buyer_profiles members write" ON public.buyer_profiles FOR ALL
  USING (public.is_business_member(business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
  WITH CHECK (public.is_business_member(business_id, auth.uid()) OR public.has_admin_role(auth.uid()));
DROP TRIGGER IF EXISTS trg_buyer_profiles_updated ON public.buyer_profiles;
CREATE TRIGGER trg_buyer_profiles_updated BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- Business addresses ----------
CREATE TABLE IF NOT EXISTS public.business_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Primary',
  contact_name TEXT,
  phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'PH',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_business_addresses_business ON public.business_addresses(business_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_addresses TO authenticated;
GRANT ALL ON public.business_addresses TO service_role;
ALTER TABLE public.business_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_addresses members read" ON public.business_addresses;
CREATE POLICY "business_addresses members read" ON public.business_addresses FOR SELECT
  USING (public.is_business_member(business_id, auth.uid()) OR public.has_admin_role(auth.uid()));
DROP POLICY IF EXISTS "business_addresses members write" ON public.business_addresses;
CREATE POLICY "business_addresses members write" ON public.business_addresses FOR ALL
  USING (public.is_business_member(business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
  WITH CHECK (public.is_business_member(business_id, auth.uid()) OR public.has_admin_role(auth.uid()));
DROP TRIGGER IF EXISTS trg_business_addresses_updated ON public.business_addresses;
CREATE TRIGGER trg_business_addresses_updated BEFORE UPDATE ON public.business_addresses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- Role policies / audit ----------
DROP POLICY IF EXISTS "admins read all roles" ON public.user_roles;
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_permission(auth.uid(), 'users.read') OR public.has_admin_role(auth.uid()));

-- Harden audit_logs: no client updates/deletes; inserts via trusted RPCs preferred
DROP POLICY IF EXISTS "audit_logs insert self" ON public.audit_logs;
CREATE POLICY "audit_logs insert via definer only" ON public.audit_logs
  FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "audit_logs admin read" ON public.audit_logs;
CREATE POLICY "audit_logs admin read" ON public.audit_logs FOR SELECT
  USING (public.has_permission(auth.uid(), 'audit_logs.read') OR public.has_admin_role(auth.uid()));

CREATE OR REPLACE FUNCTION public.write_audit_log(
  _action TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb,
  _actor_user_id UUID DEFAULT NULL,
  _actor_business_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
  _actor UUID := COALESCE(_actor_user_id, auth.uid());
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, metadata, actor_user_id, actor_business_id)
  VALUES (_action, _entity_type, _entity_id, _metadata, _actor, _actor_business_id)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.write_audit_log(text, text, uuid, jsonb, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.write_audit_log(text, text, uuid, jsonb, uuid, uuid) TO authenticated, service_role;

-- ---------- Signup trigger: never assign admin from client metadata ----------
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _intended TEXT := lower(COALESCE(NEW.raw_user_meta_data->>'intended_account_type', NEW.raw_user_meta_data->>'role', 'buyer'));
  _account_type public.intended_account_type := 'buyer';
BEGIN
  IF _intended IN ('buyer', 'supplier', 'both') THEN
    _account_type := _intended::public.intended_account_type;
  ELSE
    _account_type := 'buyer';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, intended_account_type, account_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    _account_type,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    intended_account_type = COALESCE(public.profiles.intended_account_type, EXCLUDED.intended_account_type),
    updated_at = now();

  -- Never assign admin / finance / ops roles from signup metadata.
  IF _account_type IN ('buyer', 'both') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer') ON CONFLICT DO NOTHING;
  END IF;
  IF _account_type IN ('supplier', 'both') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'supplier') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------- Auth context for the signed-in user ----------
CREATE OR REPLACE FUNCTION public.get_my_auth_context()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _profile public.profiles%ROWTYPE;
  _roles TEXT[];
  _permissions TEXT[];
  _businesses JSONB;
BEGIN
  IF _uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO _profile FROM public.profiles WHERE id = _uid;
  SELECT coalesce(array_agg(role::text ORDER BY role::text), '{}')
    INTO _roles FROM public.user_roles WHERE user_id = _uid;
  SELECT coalesce(array_agg(ap.key ORDER BY ap.key), '{}')
    INTO _permissions
  FROM public.user_admin_permissions uap
  JOIN public.admin_permissions ap ON ap.id = uap.permission_id
  WHERE uap.user_id = _uid;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'super_admin') THEN
    SELECT coalesce(array_agg(key ORDER BY key), '{}') INTO _permissions FROM public.admin_permissions;
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'business_name', b.business_name,
    'is_buyer', b.is_buyer,
    'is_supplier', b.is_supplier,
    'verification_status', b.verification_status,
    'role_in_business', bm.role_in_business
  ) ORDER BY b.created_at), '[]'::jsonb)
  INTO _businesses
  FROM public.business_members bm
  JOIN public.businesses b ON b.id = bm.business_id
  WHERE bm.user_id = _uid;

  RETURN jsonb_build_object(
    'user_id', _uid,
    'profile', jsonb_build_object(
      'id', _profile.id,
      'full_name', _profile.full_name,
      'email', _profile.email,
      'phone', _profile.phone,
      'avatar_url', _profile.avatar_url,
      'account_status', _profile.account_status,
      'intended_account_type', _profile.intended_account_type,
      'onboarding_completed_at', _profile.onboarding_completed_at,
      'last_sign_in_at', _profile.last_sign_in_at
    ),
    'roles', to_jsonb(_roles),
    'permissions', to_jsonb(_permissions),
    'businesses', _businesses
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_auth_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_auth_context() TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_last_sign_in()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  UPDATE public.profiles SET last_sign_in_at = now(), updated_at = now() WHERE id = auth.uid();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.touch_last_sign_in() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_last_sign_in() TO authenticated;

-- ---------- Onboarding RPCs ----------
CREATE OR REPLACE FUNCTION public.complete_buyer_onboarding(
  _business_name TEXT,
  _business_type TEXT DEFAULT NULL,
  _industry TEXT DEFAULT NULL,
  _location TEXT DEFAULT NULL,
  _region TEXT DEFAULT NULL,
  _contact_phone TEXT DEFAULT NULL,
  _contact_email TEXT DEFAULT NULL,
  _address_line1 TEXT DEFAULT NULL,
  _typical_categories TEXT[] DEFAULT '{}',
  _sourcing_cadence TEXT DEFAULT NULL,
  _preferred_supplier_locations TEXT DEFAULT NULL,
  _branch_count INT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _business_id UUID;
  _slug TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF coalesce(trim(_business_name), '') = '' THEN RAISE EXCEPTION 'business_name required'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'buyer') ON CONFLICT DO NOTHING;

  _slug := lower(regexp_replace(_business_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(_uid::text, 1, 8);

  INSERT INTO public.businesses (
    owner_user_id, business_name, slug, business_type, industry, location, region,
    contact_phone, contact_email, is_buyer, is_supplier, verification_status
  ) VALUES (
    _uid, trim(_business_name), _slug, _business_type, _industry, _location, _region,
    _contact_phone, _contact_email, true, false, 'unverified'
  )
  RETURNING id INTO _business_id;

  INSERT INTO public.buyer_profiles (
    business_id, typical_categories, sourcing_cadence, preferred_supplier_locations, branch_count
  ) VALUES (
    _business_id, coalesce(_typical_categories, '{}'), _sourcing_cadence, _preferred_supplier_locations, _branch_count
  );

  IF coalesce(trim(_address_line1), '') <> '' THEN
    INSERT INTO public.business_addresses (business_id, label, phone, line1, city, region, is_default)
    VALUES (_business_id, 'Primary', _contact_phone, trim(_address_line1), _location, _region, true);
  END IF;

  UPDATE public.profiles
  SET phone = COALESCE(_contact_phone, phone),
      intended_account_type = CASE
        WHEN intended_account_type = 'supplier' THEN 'both'::public.intended_account_type
        ELSE coalesce(intended_account_type, 'buyer'::public.intended_account_type)
      END,
      onboarding_completed_at = coalesce(onboarding_completed_at, now()),
      updated_at = now()
  WHERE id = _uid;

  PERFORM public.write_audit_log(
    'buyer_onboarding_completed',
    'business',
    _business_id,
    jsonb_build_object('business_name', _business_name),
    _uid,
    _business_id
  );

  RETURN _business_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complete_buyer_onboarding(text, text, text, text, text, text, text, text, text[], text, text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_buyer_onboarding(text, text, text, text, text, text, text, text, text[], text, text, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_supplier_onboarding(
  _business_name TEXT,
  _business_type TEXT DEFAULT NULL,
  _industry TEXT DEFAULT NULL,
  _location TEXT DEFAULT NULL,
  _region TEXT DEFAULT NULL,
  _contact_phone TEXT DEFAULT NULL,
  _contact_email TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _supplier_type TEXT DEFAULT NULL,
  _years_operating INT DEFAULT NULL,
  _service_regions TEXT[] DEFAULT '{}',
  _address_line1 TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _business_id UUID;
  _slug TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF coalesce(trim(_business_name), '') = '' THEN RAISE EXCEPTION 'business_name required'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'supplier') ON CONFLICT DO NOTHING;

  _slug := lower(regexp_replace(_business_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(_uid::text, 1, 8);

  INSERT INTO public.businesses (
    owner_user_id, business_name, slug, business_type, industry, location, region,
    contact_phone, contact_email, description, is_buyer, is_supplier, verification_status
  ) VALUES (
    _uid, trim(_business_name), _slug, _business_type, _industry, _location, _region,
    _contact_phone, _contact_email, _description, false, true, 'pending'
  )
  RETURNING id INTO _business_id;

  INSERT INTO public.supplier_profiles (
    business_id, supplier_type, years_operating, service_regions, documents_verified
  ) VALUES (
    _business_id, _supplier_type, _years_operating, coalesce(_service_regions, '{}'), false
  );

  IF coalesce(trim(_address_line1), '') <> '' THEN
    INSERT INTO public.business_addresses (business_id, label, phone, line1, city, region, is_default)
    VALUES (_business_id, 'Warehouse / HQ', _contact_phone, trim(_address_line1), _location, _region, true);
  END IF;

  UPDATE public.profiles
  SET phone = COALESCE(_contact_phone, phone),
      intended_account_type = CASE
        WHEN intended_account_type = 'buyer' THEN 'both'::public.intended_account_type
        ELSE coalesce(intended_account_type, 'supplier'::public.intended_account_type)
      END,
      onboarding_completed_at = coalesce(onboarding_completed_at, now()),
      updated_at = now()
  WHERE id = _uid;

  PERFORM public.write_audit_log(
    'supplier_onboarding_completed',
    'business',
    _business_id,
    jsonb_build_object('business_name', _business_name, 'verification_status', 'pending'),
    _uid,
    _business_id
  );

  RETURN _business_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complete_supplier_onboarding(text, text, text, text, text, text, text, text, text, int, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_supplier_onboarding(text, text, text, text, text, text, text, text, text, int, text[], text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_my_profile(
  _full_name TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL,
  _avatar_url TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.profiles
  SET
    full_name = COALESCE(_full_name, full_name),
    phone = COALESCE(_phone, phone),
    avatar_url = COALESCE(_avatar_url, avatar_url),
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO _row;
  RETURN _row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_my_profile(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_business_address(
  _business_id UUID,
  _label TEXT,
  _line1 TEXT,
  _contact_name TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL,
  _line2 TEXT DEFAULT NULL,
  _city TEXT DEFAULT NULL,
  _region TEXT DEFAULT NULL,
  _postal_code TEXT DEFAULT NULL,
  _is_default BOOLEAN DEFAULT false,
  _address_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.is_business_member(_business_id, auth.uid()) THEN
    RAISE EXCEPTION 'not a business member';
  END IF;
  IF coalesce(trim(_line1), '') = '' THEN RAISE EXCEPTION 'line1 required'; END IF;

  IF _is_default THEN
    UPDATE public.business_addresses SET is_default = false WHERE business_id = _business_id;
  END IF;

  IF _address_id IS NULL THEN
    INSERT INTO public.business_addresses (
      business_id, label, contact_name, phone, line1, line2, city, region, postal_code, is_default
    ) VALUES (
      _business_id, coalesce(nullif(trim(_label), ''), 'Address'), _contact_name, _phone,
      trim(_line1), _line2, _city, _region, _postal_code, coalesce(_is_default, false)
    )
    RETURNING id INTO _id;
  ELSE
    UPDATE public.business_addresses
    SET label = coalesce(nullif(trim(_label), ''), label),
        contact_name = COALESCE(_contact_name, contact_name),
        phone = COALESCE(_phone, phone),
        line1 = trim(_line1),
        line2 = COALESCE(_line2, line2),
        city = COALESCE(_city, city),
        region = COALESCE(_region, region),
        postal_code = COALESCE(_postal_code, postal_code),
        is_default = coalesce(_is_default, is_default),
        updated_at = now()
    WHERE id = _address_id AND business_id = _business_id
    RETURNING id INTO _id;
    IF _id IS NULL THEN RAISE EXCEPTION 'address not found'; END IF;
  END IF;

  RETURN _id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.upsert_business_address(uuid, text, text, text, text, text, text, text, text, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_business_address(uuid, text, text, text, text, text, text, text, text, boolean, uuid) TO authenticated;

-- ---------- Admin role / permission management ----------
CREATE OR REPLACE FUNCTION public.admin_set_user_roles(
  _target_user_id UUID,
  _roles public.app_role[],
  _reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _before JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT (
    public.has_permission(auth.uid(), 'users.manage')
    OR public.has_role(auth.uid(), 'super_admin')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Non-super-admins cannot grant super_admin
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    IF EXISTS (
      SELECT 1 FROM unnest(_roles) r(role) WHERE r.role = 'super_admin'::public.app_role
    ) THEN
      RAISE EXCEPTION 'cannot grant super_admin';
    END IF;
  END IF;

  SELECT coalesce(jsonb_agg(role::text), '[]'::jsonb)
    INTO _before FROM public.user_roles WHERE user_id = _target_user_id;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  FOREACH _role IN ARRAY _roles LOOP
    INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _role) ON CONFLICT DO NOTHING;
  END LOOP;

  PERFORM public.write_audit_log(
    'admin_set_user_roles',
    'user',
    _target_user_id,
    jsonb_build_object('before', _before, 'after', to_jsonb(_roles), 'reason', _reason),
    auth.uid(),
    NULL
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, public.app_role[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, public.app_role[], text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_permissions(
  _target_user_id UUID,
  _permission_keys TEXT[],
  _reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _before JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT (
    public.has_permission(auth.uid(), 'users.manage')
    OR public.has_role(auth.uid(), 'super_admin')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT coalesce(jsonb_agg(ap.key), '[]'::jsonb)
    INTO _before
  FROM public.user_admin_permissions uap
  JOIN public.admin_permissions ap ON ap.id = uap.permission_id
  WHERE uap.user_id = _target_user_id;

  DELETE FROM public.user_admin_permissions WHERE user_id = _target_user_id;
  INSERT INTO public.user_admin_permissions (user_id, permission_id, granted_by)
  SELECT _target_user_id, ap.id, auth.uid()
  FROM public.admin_permissions ap
  WHERE ap.key = ANY (_permission_keys)
  ON CONFLICT DO NOTHING;

  PERFORM public.write_audit_log(
    'admin_set_user_permissions',
    'user',
    _target_user_id,
    jsonb_build_object('before', _before, 'after', to_jsonb(_permission_keys), 'reason', _reason),
    auth.uid(),
    NULL
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_permissions(uuid, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_permissions(uuid, text[], text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  _target_user_id UUID,
  _status public.account_status,
  _reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _before public.account_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.has_permission(auth.uid(), 'users.manage') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT account_status INTO _before FROM public.profiles WHERE id = _target_user_id;
  UPDATE public.profiles SET account_status = _status, updated_at = now() WHERE id = _target_user_id;

  PERFORM public.write_audit_log(
    'admin_set_account_status',
    'user',
    _target_user_id,
    jsonb_build_object('before', _before, 'after', _status, 'reason', _reason),
    auth.uid(),
    NULL
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_account_status(uuid, public.account_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, public.account_status, text) TO authenticated;
