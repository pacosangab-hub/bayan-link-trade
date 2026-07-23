
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (role = 'super_admin' AND _role = 'admin'))
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;

  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  ip_address text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own activity or admin" ON public.activity_logs;
CREATE POLICY "own activity or admin" ON public.activity_logs FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'demo',
  provider_ref text,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'PHP',
  status public.payment_status NOT NULL DEFAULT 'unpaid',
  method text,
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment parties read" ON public.payments;
CREATE POLICY "payment parties read" ON public.payments FOR SELECT
  USING (
    public.is_business_member(buyer_business_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_business_member(o.supplier_business_id, auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );
DROP POLICY IF EXISTS "payment buyer write" ON public.payments;
CREATE POLICY "payment buyer write" ON public.payments FOR INSERT
  WITH CHECK (public.is_business_member(buyer_business_id, auth.uid()));
DROP POLICY IF EXISTS "payment admin update" ON public.payments;
CREATE POLICY "payment admin update" ON public.payments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status, created_at DESC);
DROP TRIGGER IF EXISTS trg_payments_updated ON public.payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  procurement_categories text[] NOT NULL DEFAULT '{}',
  monthly_purchase_volume text,
  preferred_payment_terms text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_profiles TO authenticated;
GRANT ALL ON public.buyer_profiles TO service_role;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "buyer profile members" ON public.buyer_profiles;
CREATE POLICY "buyer profile members" ON public.buyer_profiles FOR ALL
  USING (public.is_business_member(business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_business_member(business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_buyer_profiles_updated ON public.buyer_profiles;
CREATE TRIGGER trg_buyer_profiles_updated BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  alt text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product images public read" ON public.product_images;
CREATE POLICY "product images public read" ON public.product_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "product images supplier write" ON public.product_images;
CREATE POLICY "product images supplier write" ON public.product_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.products p
      WHERE p.id = product_id AND public.is_business_member(p.supplier_business_id, auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p
      WHERE p.id = product_id AND public.is_business_member(p.supplier_business_id, auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, position);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin settings read auth" ON public.admin_settings;
CREATE POLICY "admin settings read auth" ON public.admin_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "admin settings write admin" ON public.admin_settings;
CREATE POLICY "admin settings write admin" ON public.admin_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.admin_kpis_v
WITH (security_invoker = on) AS
SELECT
  (SELECT count(*) FROM public.businesses WHERE is_buyer)                              AS total_buyers,
  (SELECT count(*) FROM public.businesses WHERE is_supplier)                           AS total_suppliers,
  (SELECT count(*) FROM public.verification_documents WHERE status = 'pending')        AS pending_verifications,
  (SELECT count(*) FROM public.products WHERE listing_status = 'active')               AS active_products,
  (SELECT count(*) FROM public.rfqs WHERE created_at >= current_date)                  AS rfqs_today,
  (SELECT count(*) FROM public.orders WHERE created_at >= current_date)                AS orders_today,
  (SELECT coalesce(sum(total_amount),0) FROM public.orders)                            AS gmv,
  (SELECT coalesce(sum(platform_fee),0) FROM public.orders)                            AS revenue,
  (SELECT count(*) FROM public.payments WHERE status = 'unpaid')                       AS pending_payments,
  (SELECT count(*) FROM public.payments WHERE status = 'paid_demo')                    AS successful_payments,
  (SELECT count(*) FROM public.payments WHERE status = 'refunded')                     AS refunded_payments,
  (SELECT count(*) FROM public.shipments WHERE current_status NOT IN ('delivered','cancelled')) AS active_deliveries,
  (SELECT count(*) FROM public.orders WHERE order_status = 'completed')                AS completed_orders,
  (SELECT count(*) FROM public.disputes WHERE dispute_status = 'open')                 AS pending_disputes,
  (SELECT count(*) FROM public.reviews)                                                AS total_reviews,
  (SELECT count(*) FROM auth.users WHERE created_at >= current_date - interval '7 days') AS new_users_7d;
GRANT SELECT ON public.admin_kpis_v TO authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products','rfqs','rfq_quotes','custom_offers','orders','messages',
    'notifications','shipments','shipment_events','verification_documents',
    'payments','activity_logs','disputes','conversations'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
             WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(listing_status);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_business_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON public.orders(supplier_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at DESC);
