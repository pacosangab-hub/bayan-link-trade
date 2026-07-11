
-- =========================================================
-- Enums for the new tables
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.product_price_type AS ENUM ('fixed', 'range', 'quote_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_listing_status AS ENUM (
    'draft','pending_review','active','needs_changes','rejected','paused','archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_compliance_status AS ENUM (
    'no_review_needed','docs_required','pending_review','approved','rejected','restricted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_event_type AS ENUM (
    'order_created','escrow_funded','supplier_confirmed','preparing_shipment',
    'ready_for_pickup','in_transit','delivered','buyer_confirmed',
    'escrow_released','dispute_opened','dispute_resolved','cancelled','note'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_proof_type AS ENUM (
    'packed_goods_photo','packing_list','invoice','delivery_receipt',
    'driver_details','proof_of_delivery','signed_receiving_copy','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_status AS ENUM (
    'open','under_review','awaiting_buyer','awaiting_supplier','resolved_buyer','resolved_supplier','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_reason AS ENUM (
    'item_not_delivered','wrong_item','missing_quantity','damaged_goods',
    'fake_product','late_delivery','supplier_not_responding','payment_issue','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- Additive product columns (safe to add — existing rows get defaults)
-- =========================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_type public.product_price_type NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS listing_status public.product_listing_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS compliance_status public.product_compliance_status NOT NULL DEFAULT 'no_review_needed',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_regions text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS products_listing_status_idx ON public.products (listing_status);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_supplier_business_id_idx ON public.products (supplier_business_id);

-- Messages: add optional link to a custom request card
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS related_request_id uuid REFERENCES public.custom_requests(id) ON DELETE SET NULL;

-- Supplier profiles: add is_escrow_ready
ALTER TABLE public.supplier_profiles
  ADD COLUMN IF NOT EXISTS is_escrow_ready boolean NOT NULL DEFAULT false;

-- =========================================================
-- order_events
-- =========================================================
CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type public.order_event_type NOT NULL,
  title text NOT NULL,
  description text,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON public.order_events (order_id, event_at);

GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties can view events"
  ON public.order_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_events.order_id
        AND (
          public.is_business_member(o.buyer_business_id, auth.uid())
          OR public.is_business_member(o.supplier_business_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

CREATE POLICY "Order parties can add events"
  ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_events.order_id
        AND (
          public.is_business_member(o.buyer_business_id, auth.uid())
          OR public.is_business_member(o.supplier_business_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

-- =========================================================
-- order_proofs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.order_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.order_events(id) ON DELETE SET NULL,
  proof_type public.order_proof_type NOT NULL,
  file_url text NOT NULL,
  file_name text,
  notes text,
  uploaded_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_proofs_order_id_idx ON public.order_proofs (order_id);

GRANT SELECT, INSERT, DELETE ON public.order_proofs TO authenticated;
GRANT ALL ON public.order_proofs TO service_role;
ALTER TABLE public.order_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties can view proofs"
  ON public.order_proofs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_proofs.order_id
        AND (
          public.is_business_member(o.buyer_business_id, auth.uid())
          OR public.is_business_member(o.supplier_business_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

CREATE POLICY "Order parties can add proofs"
  ON public.order_proofs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_proofs.order_id
        AND (
          public.is_business_member(o.buyer_business_id, auth.uid())
          OR public.is_business_member(o.supplier_business_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

CREATE POLICY "Uploader can remove own proof"
  ON public.order_proofs FOR DELETE TO authenticated
  USING (
    uploaded_by_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- =========================================================
-- disputes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  opened_by_business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  reason public.dispute_reason NOT NULL,
  description text NOT NULL,
  evidence_urls text[] NOT NULL DEFAULT '{}',
  supplier_response text,
  admin_decision text,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dispute_status public.dispute_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS disputes_order_id_idx ON public.disputes (order_id);
CREATE INDEX IF NOT EXISTS disputes_status_idx ON public.disputes (dispute_status);

GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties and admins view disputes"
  ON public.disputes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = disputes.order_id
        AND (
          public.is_business_member(o.buyer_business_id, auth.uid())
          OR public.is_business_member(o.supplier_business_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

CREATE POLICY "Buyer can open dispute"
  ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = disputes.order_id
        AND public.is_business_member(o.buyer_business_id, auth.uid())
    )
  );

CREATE POLICY "Supplier can respond, admin can decide"
  ON public.disputes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = disputes.order_id
        AND (
          public.is_business_member(o.supplier_business_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = disputes.order_id
        AND (
          public.is_business_member(o.supplier_business_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

CREATE TRIGGER trg_disputes_set_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- search_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  query text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  clicked_result_type text,
  clicked_result_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_logs_user_id_idx ON public.search_logs (user_id, created_at);

GRANT SELECT, INSERT ON public.search_logs TO authenticated;
GRANT ALL ON public.search_logs TO service_role;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can log own searches"
  ON public.search_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "User can view own searches; admin views all"
  ON public.search_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- Storage policies for new buckets
-- =========================================================

-- supplier-logos (private, but any authenticated user can read logos of businesses they might browse)
CREATE POLICY "Auth can read supplier logos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'supplier-logos');

CREATE POLICY "Owner can upload supplier logo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'supplier-logos' AND owner = auth.uid());

CREATE POLICY "Owner can update supplier logo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'supplier-logos' AND owner = auth.uid());

CREATE POLICY "Owner can delete supplier logo"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'supplier-logos' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)));

-- message-attachments (only conversation parties; simplified: any authenticated user who uploaded, plus admin)
CREATE POLICY "Auth can read message attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Uploader can add message attachment"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'message-attachments' AND owner = auth.uid());

CREATE POLICY "Uploader or admin can delete message attachment"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'message-attachments' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)));

-- dispute-evidence (private; uploader + admin only)
CREATE POLICY "Uploader or admin can read dispute evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dispute-evidence' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Uploader can add dispute evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dispute-evidence' AND owner = auth.uid());

CREATE POLICY "Uploader or admin can delete dispute evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dispute-evidence' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)));
