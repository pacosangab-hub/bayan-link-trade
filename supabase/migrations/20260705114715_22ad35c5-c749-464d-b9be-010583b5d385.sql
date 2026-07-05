
-- ============================================================
-- Philippine Trade Hub / PSG Supply Gateway — Full backend schema
-- ============================================================

-- ---------- ENUMS ----------
CREATE TYPE public.app_role AS ENUM ('admin', 'buyer', 'supplier', 'carrier', 'user');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE public.product_stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'made_to_order');
CREATE TYPE public.rfq_status AS ENUM ('draft', 'open', 'receiving_quotes', 'awaiting_decision', 'supplier_selected', 'order_created', 'completed', 'closed', 'expired');
CREATE TYPE public.rfq_quote_status AS ENUM ('submitted', 'shortlisted', 'rejected', 'accepted', 'revised', 'expired');
CREATE TYPE public.custom_request_status AS ENUM ('new_request', 'waiting_for_supplier_offer', 'custom_offer_sent', 'buyer_requested_changes', 'accepted', 'rejected', 'converted_to_order', 'expired');
CREATE TYPE public.custom_offer_status AS ENUM ('pending_review', 'accepted', 'changes_requested', 'rejected', 'expired', 'converted_to_order');
CREATE TYPE public.order_source_type AS ENUM ('product_checkout', 'rfq_quote', 'custom_offer', 'logistics_booking');
CREATE TYPE public.order_status AS ENUM ('order_created', 'awaiting_payment', 'escrow_funded', 'supplier_preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid_demo', 'refunded');
CREATE TYPE public.escrow_status AS ENUM ('not_started', 'awaiting_payment', 'funded', 'held', 'released', 'disputed', 'refunded', 'cancelled');
CREATE TYPE public.fulfillment_status AS ENUM ('not_started', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'completed');
CREATE TYPE public.logistics_status AS ENUM ('draft', 'open_for_quotes', 'receiving_quotes', 'carrier_selected', 'pickup_scheduled', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed');
CREATE TYPE public.shipment_event_type AS ENUM ('booking_confirmed', 'driver_assigned', 'arrived_at_pickup', 'cargo_loaded', 'in_transit', 'arrived_at_dropoff', 'delivered', 'buyer_confirmed');
CREATE TYPE public.message_type AS ENUM ('text', 'custom_offer_card', 'rfq_quote_card', 'logistics_quote_card', 'order_update', 'system_notification');
CREATE TYPE public.notification_type AS ENUM ('rfq', 'quote', 'offer', 'order', 'escrow', 'shipment', 'message', 'verification', 'system');
CREATE TYPE public.verification_doc_status AS ENUM ('pending', 'approved', 'rejected');

-- ---------- updated_at helper ----------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable to all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "user updates own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "user inserts own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- user_roles (app-level)  — for admin gating
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- businesses & business_members
-- ============================================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  business_type TEXT,
  description TEXT,
  industry TEXT,
  location TEXT,
  region TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  logo_url TEXT,
  cover_url TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  is_buyer BOOLEAN NOT NULL DEFAULT false,
  is_supplier BOOLEAN NOT NULL DEFAULT false,
  is_carrier BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT ON public.businesses TO anon;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_businesses_updated BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_in_business TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.business_members TO authenticated;
GRANT ALL ON public.business_members TO service_role;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_business_member(_business_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members WHERE business_id = _business_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_business_ids(_user_id UUID)
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.businesses WHERE owner_user_id = _user_id
  UNION
  SELECT business_id FROM public.business_members WHERE user_id = _user_id;
$$;

-- Auto-add owner as member
CREATE OR REPLACE FUNCTION public.tg_add_owner_member() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.business_members (business_id, user_id, role_in_business)
  VALUES (NEW.id, NEW.owner_user_id, 'owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_biz_owner_member AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.tg_add_owner_member();

CREATE POLICY "businesses public read" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "user creates business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "members update business" ON public.businesses FOR UPDATE
  USING (public.is_business_member(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner deletes business" ON public.businesses FOR DELETE USING (owner_user_id = auth.uid());

CREATE POLICY "members read memberships" ON public.business_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_business_member(business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner adds members" ON public.business_members FOR INSERT
  WITH CHECK (public.is_business_member(business_id, auth.uid()));
CREATE POLICY "owner removes members" ON public.business_members FOR DELETE
  USING (public.is_business_member(business_id, auth.uid()));

-- ============================================================
-- supplier_profiles (extended metadata for supplier businesses)
-- ============================================================
CREATE TABLE public.supplier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_type TEXT,
  years_operating INT,
  verification_badges TEXT[] DEFAULT '{}',
  documents_verified BOOLEAN DEFAULT false,
  service_regions TEXT[] DEFAULT '{}',
  response_time TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  completed_orders INT DEFAULT 0,
  is_gold_supplier BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.supplier_profiles TO authenticated;
GRANT SELECT ON public.supplier_profiles TO anon;
GRANT ALL ON public.supplier_profiles TO service_role;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_profiles public read" ON public.supplier_profiles FOR SELECT USING (true);
CREATE POLICY "supplier_profiles members write" ON public.supplier_profiles FOR ALL
  USING (public.is_business_member(business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_business_member(business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_supplier_profiles_updated BEFORE UPDATE ON public.supplier_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  parent_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  industry_group TEXT,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admin manages categories" ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- products
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  unit TEXT,
  minimum_order_quantity INT DEFAULT 1,
  price_min NUMERIC(14,2),
  price_max NUMERIC(14,2),
  fixed_price NUMERIC(14,2),
  stock_status public.product_stock_status NOT NULL DEFAULT 'in_stock',
  lead_time TEXT,
  location TEXT,
  region TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read active" ON public.products FOR SELECT USING (is_active OR public.is_business_member(supplier_business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "supplier members write products" ON public.products FOR ALL
  USING (public.is_business_member(supplier_business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_business_member(supplier_business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_products_supplier ON public.products(supplier_business_id);
CREATE INDEX idx_products_category ON public.products(category_id);
