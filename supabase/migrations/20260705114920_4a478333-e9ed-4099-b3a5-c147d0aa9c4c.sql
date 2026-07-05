
-- ============================================================
-- RFQs
-- ============================================================
CREATE TABLE public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  product_needed TEXT,
  quantity NUMERIC(14,2),
  unit TEXT,
  target_budget NUMERIC(14,2),
  delivery_location TEXT,
  region TEXT,
  needed_by DATE,
  recurring_type TEXT,
  requirements TEXT,
  status public.rfq_status NOT NULL DEFAULT 'open',
  quotes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs TO authenticated;
GRANT SELECT ON public.rfqs TO anon;
GRANT ALL ON public.rfqs TO service_role;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
-- Open RFQs are visible to all authenticated users (so suppliers can browse and quote).
CREATE POLICY "rfqs visible open or member" ON public.rfqs FOR SELECT
  USING (status <> 'draft' OR public.is_business_member(buyer_business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "buyer creates rfq" ON public.rfqs FOR INSERT WITH CHECK (public.is_business_member(buyer_business_id, auth.uid()));
CREATE POLICY "buyer updates rfq" ON public.rfqs FOR UPDATE
  USING (public.is_business_member(buyer_business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "buyer deletes rfq" ON public.rfqs FOR DELETE
  USING (public.is_business_member(buyer_business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_rfqs_updated BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- RFQ quotes
-- ============================================================
CREATE TABLE public.rfq_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  unit_price NUMERIC(14,2),
  total_price NUMERIC(14,2),
  minimum_order_quantity INT,
  lead_time TEXT,
  delivery_fee NUMERIC(14,2) DEFAULT 0,
  payment_terms TEXT,
  stock_availability TEXT,
  message TEXT,
  attachments TEXT[] DEFAULT '{}',
  status public.rfq_quote_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_quotes TO authenticated;
GRANT ALL ON public.rfq_quotes TO service_role;
ALTER TABLE public.rfq_quotes ENABLE ROW LEVEL SECURITY;
-- Visible to buyer of the RFQ or supplier who submitted
CREATE POLICY "rfq_quotes visible" ON public.rfq_quotes FOR SELECT USING (
  public.is_business_member(supplier_business_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id = rfq_id AND public.is_business_member(r.buyer_business_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "supplier submits quote" ON public.rfq_quotes FOR INSERT
  WITH CHECK (public.is_business_member(supplier_business_id, auth.uid()));
CREATE POLICY "quote owner or buyer updates" ON public.rfq_quotes FOR UPDATE USING (
  public.is_business_member(supplier_business_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id = rfq_id AND public.is_business_member(r.buyer_business_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "supplier deletes own quote" ON public.rfq_quotes FOR DELETE
  USING (public.is_business_member(supplier_business_id, auth.uid()));
CREATE TRIGGER trg_rfq_quotes_updated BEFORE UPDATE ON public.rfq_quotes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Trigger: increment rfq.quotes_count and flip status when quote submitted
CREATE OR REPLACE FUNCTION public.tg_rfq_quote_after_insert() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.rfqs
     SET quotes_count = quotes_count + 1,
         status = CASE WHEN status IN ('open') THEN 'receiving_quotes'::public.rfq_status ELSE status END
   WHERE id = NEW.rfq_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rfq_quote_ai AFTER INSERT ON public.rfq_quotes
  FOR EACH ROW EXECUTE FUNCTION public.tg_rfq_quote_after_insert();

-- ============================================================
-- custom_requests
-- ============================================================
CREATE TABLE public.custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  product_needed TEXT,
  quantity NUMERIC(14,2),
  unit TEXT,
  target_budget NUMERIC(14,2),
  delivery_location TEXT,
  needed_by DATE,
  recurring_type TEXT,
  custom_requirements TEXT,
  packaging_requirements TEXT,
  certification_requirements TEXT,
  delivery_requirements TEXT,
  attachments TEXT[] DEFAULT '{}',
  message TEXT,
  status public.custom_request_status NOT NULL DEFAULT 'new_request',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_requests TO authenticated;
GRANT ALL ON public.custom_requests TO service_role;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_requests visible parties" ON public.custom_requests FOR SELECT USING (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "buyer creates custom request" ON public.custom_requests FOR INSERT
  WITH CHECK (public.is_business_member(buyer_business_id, auth.uid()));
CREATE POLICY "parties update custom request" ON public.custom_requests FOR UPDATE USING (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE TRIGGER trg_custom_requests_updated BEFORE UPDATE ON public.custom_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- custom_offers + versions
-- ============================================================
CREATE TABLE public.custom_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_request_id UUID REFERENCES public.custom_requests(id) ON DELETE SET NULL,
  buyer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(14,2),
  unit TEXT,
  unit_price NUMERIC(14,2),
  total_price NUMERIC(14,2),
  delivery_fee NUMERIC(14,2) DEFAULT 0,
  platform_fee NUMERIC(14,2) DEFAULT 0,
  vat_amount NUMERIC(14,2) DEFAULT 0,
  total_payable NUMERIC(14,2),
  minimum_order_quantity INT,
  lead_time TEXT,
  delivery_schedule TEXT,
  payment_terms TEXT,
  escrow_available BOOLEAN DEFAULT true,
  valid_until DATE,
  stock_availability TEXT,
  warranty_terms TEXT,
  certifications_included TEXT,
  supplier_notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT false,
  recurring_schedule TEXT,
  contract_duration TEXT,
  price_lock_period TEXT,
  version_number INT NOT NULL DEFAULT 1,
  status public.custom_offer_status NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_offers TO authenticated;
GRANT ALL ON public.custom_offers TO service_role;
ALTER TABLE public.custom_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_offers visible parties" ON public.custom_offers FOR SELECT USING (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "supplier creates offer" ON public.custom_offers FOR INSERT
  WITH CHECK (public.is_business_member(supplier_business_id, auth.uid()));
CREATE POLICY "parties update offer" ON public.custom_offers FOR UPDATE USING (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE TRIGGER trg_custom_offers_updated BEFORE UPDATE ON public.custom_offers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.custom_offer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_offer_id UUID NOT NULL REFERENCES public.custom_offers(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_summary TEXT,
  offer_snapshot_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.custom_offer_versions TO authenticated;
GRANT ALL ON public.custom_offer_versions TO service_role;
ALTER TABLE public.custom_offer_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offer versions visible parties" ON public.custom_offer_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.custom_offers o WHERE o.id = custom_offer_id
     AND (public.is_business_member(o.buyer_business_id, auth.uid()) OR public.is_business_member(o.supplier_business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "parties create offer version" ON public.custom_offer_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.custom_offers o WHERE o.id = custom_offer_id
     AND (public.is_business_member(o.buyer_business_id, auth.uid()) OR public.is_business_member(o.supplier_business_id, auth.uid())))
);

-- ============================================================
-- orders
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_type public.order_source_type NOT NULL DEFAULT 'product_checkout',
  source_id UUID,
  order_number TEXT UNIQUE,
  title TEXT,
  subtotal NUMERIC(14,2) DEFAULT 0,
  delivery_fee NUMERIC(14,2) DEFAULT 0,
  platform_fee NUMERIC(14,2) DEFAULT 0,
  tax_amount NUMERIC(14,2) DEFAULT 0,
  total_amount NUMERIC(14,2) DEFAULT 0,
  delivery_location TEXT,
  delivery_date DATE,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  escrow_status public.escrow_status NOT NULL DEFAULT 'not_started',
  fulfillment_status public.fulfillment_status NOT NULL DEFAULT 'not_started',
  order_status public.order_status NOT NULL DEFAULT 'order_created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders visible parties" ON public.orders FOR SELECT USING (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "parties create order" ON public.orders FOR INSERT WITH CHECK (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
);
CREATE POLICY "parties update order" ON public.orders FOR UPDATE USING (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT,
  quantity NUMERIC(14,2),
  unit TEXT,
  unit_price NUMERIC(14,2),
  total_price NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items via order" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
    public.is_business_member(o.buyer_business_id, auth.uid())
    OR public.is_business_member(o.supplier_business_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "order_items write via order" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
    public.is_business_member(o.buyer_business_id, auth.uid())
    OR public.is_business_member(o.supplier_business_id, auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
    public.is_business_member(o.buyer_business_id, auth.uid())
    OR public.is_business_member(o.supplier_business_id, auth.uid())))
);

-- ============================================================
-- escrow_transactions
-- ============================================================
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(14,2) DEFAULT 0,
  escrow_status public.escrow_status NOT NULL DEFAULT 'awaiting_payment',
  release_condition TEXT,
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.escrow_transactions TO authenticated;
GRANT ALL ON public.escrow_transactions TO service_role;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escrow visible parties" ON public.escrow_transactions FOR SELECT USING (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "escrow parties write" ON public.escrow_transactions FOR ALL USING (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  public.is_business_member(buyer_business_id, auth.uid())
  OR public.is_business_member(supplier_business_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE TRIGGER trg_escrow_updated BEFORE UPDATE ON public.escrow_transactions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- logistics
-- ============================================================
CREATE TABLE public.logistics_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  buyer_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  shipper_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  title TEXT,
  cargo_type TEXT,
  cargo_description TEXT,
  weight NUMERIC(14,2),
  volume NUMERIC(14,2),
  item_count INT,
  pickup_address TEXT,
  pickup_contact_name TEXT,
  pickup_contact_phone TEXT,
  dropoff_address TEXT,
  dropoff_contact_name TEXT,
  dropoff_contact_phone TEXT,
  vehicle_type TEXT,
  special_requirements TEXT,
  pickup_date DATE,
  pickup_time TEXT,
  delivery_deadline DATE,
  target_budget NUMERIC(14,2),
  insurance_required BOOLEAN DEFAULT false,
  gps_tracking_required BOOLEAN DEFAULT false,
  status public.logistics_status NOT NULL DEFAULT 'open_for_quotes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logistics_requests TO authenticated;
GRANT ALL ON public.logistics_requests TO service_role;
ALTER TABLE public.logistics_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logistics req visible" ON public.logistics_requests FOR SELECT USING (
  status IN ('open_for_quotes','receiving_quotes')
  OR (buyer_business_id IS NOT NULL AND public.is_business_member(buyer_business_id, auth.uid()))
  OR (shipper_business_id IS NOT NULL AND public.is_business_member(shipper_business_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "logistics req write" ON public.logistics_requests FOR ALL USING (
  (buyer_business_id IS NOT NULL AND public.is_business_member(buyer_business_id, auth.uid()))
  OR (shipper_business_id IS NOT NULL AND public.is_business_member(shipper_business_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  (buyer_business_id IS NOT NULL AND public.is_business_member(buyer_business_id, auth.uid()))
  OR (shipper_business_id IS NOT NULL AND public.is_business_member(shipper_business_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE TRIGGER trg_logistics_req_updated BEFORE UPDATE ON public.logistics_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.logistics_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logistics_request_id UUID NOT NULL REFERENCES public.logistics_requests(id) ON DELETE CASCADE,
  carrier_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  vehicle_offered TEXT,
  total_price NUMERIC(14,2),
  pickup_availability TEXT,
  estimated_delivery_time TEXT,
  includes_loading BOOLEAN DEFAULT false,
  includes_insurance BOOLEAN DEFAULT false,
  driver_notes TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logistics_quotes TO authenticated;
GRANT ALL ON public.logistics_quotes TO service_role;
ALTER TABLE public.logistics_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logistics quotes visible" ON public.logistics_quotes FOR SELECT USING (
  public.is_business_member(carrier_business_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.logistics_requests r WHERE r.id = logistics_request_id
    AND ((r.buyer_business_id IS NOT NULL AND public.is_business_member(r.buyer_business_id, auth.uid()))
      OR (r.shipper_business_id IS NOT NULL AND public.is_business_member(r.shipper_business_id, auth.uid()))))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "carrier submits logistics quote" ON public.logistics_quotes FOR INSERT
  WITH CHECK (public.is_business_member(carrier_business_id, auth.uid()));
CREATE POLICY "logistics quote update" ON public.logistics_quotes FOR UPDATE USING (
  public.is_business_member(carrier_business_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.logistics_requests r WHERE r.id = logistics_request_id
    AND ((r.buyer_business_id IS NOT NULL AND public.is_business_member(r.buyer_business_id, auth.uid()))
      OR (r.shipper_business_id IS NOT NULL AND public.is_business_member(r.shipper_business_id, auth.uid()))))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE TRIGGER trg_logistics_quote_updated BEFORE UPDATE ON public.logistics_quotes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logistics_request_id UUID REFERENCES public.logistics_requests(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  carrier_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_type TEXT,
  plate_number TEXT,
  current_status TEXT DEFAULT 'booking_confirmed',
  current_location TEXT,
  eta TIMESTAMPTZ,
  proof_of_delivery_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipments visible parties" ON public.shipments FOR SELECT USING (
  (carrier_business_id IS NOT NULL AND public.is_business_member(carrier_business_id, auth.uid()))
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
     public.is_business_member(o.buyer_business_id, auth.uid())
     OR public.is_business_member(o.supplier_business_id, auth.uid())))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "shipments write parties" ON public.shipments FOR ALL USING (
  (carrier_business_id IS NOT NULL AND public.is_business_member(carrier_business_id, auth.uid()))
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
     public.is_business_member(o.buyer_business_id, auth.uid())
     OR public.is_business_member(o.supplier_business_id, auth.uid())))
  OR public.has_role(auth.uid(), 'admin')
) WITH CHECK (true);
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_type public.shipment_event_type NOT NULL,
  event_label TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.shipment_events TO authenticated;
GRANT ALL ON public.shipment_events TO service_role;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipment events via shipment" ON public.shipment_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (
    (s.carrier_business_id IS NOT NULL AND public.is_business_member(s.carrier_business_id, auth.uid()))
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = s.order_id AND (
      public.is_business_member(o.buyer_business_id, auth.uid()) OR public.is_business_member(o.supplier_business_id, auth.uid())))
    OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "shipment events insert parties" ON public.shipment_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (
    (s.carrier_business_id IS NOT NULL AND public.is_business_member(s.carrier_business_id, auth.uid()))
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = s.order_id AND (
      public.is_business_member(o.buyer_business_id, auth.uid()) OR public.is_business_member(o.supplier_business_id, auth.uid())))))
);

-- ============================================================
-- conversations & messages
-- ============================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  supplier_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  carrier_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  related_type TEXT,
  related_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations visible parties" ON public.conversations FOR SELECT USING (
  (buyer_business_id IS NOT NULL AND public.is_business_member(buyer_business_id, auth.uid()))
  OR (supplier_business_id IS NOT NULL AND public.is_business_member(supplier_business_id, auth.uid()))
  OR (carrier_business_id IS NOT NULL AND public.is_business_member(carrier_business_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "conversations insert parties" ON public.conversations FOR INSERT WITH CHECK (
  (buyer_business_id IS NOT NULL AND public.is_business_member(buyer_business_id, auth.uid()))
  OR (supplier_business_id IS NOT NULL AND public.is_business_member(supplier_business_id, auth.uid()))
  OR (carrier_business_id IS NOT NULL AND public.is_business_member(carrier_business_id, auth.uid()))
);
CREATE POLICY "conversations update parties" ON public.conversations FOR UPDATE USING (
  (buyer_business_id IS NOT NULL AND public.is_business_member(buyer_business_id, auth.uid()))
  OR (supplier_business_id IS NOT NULL AND public.is_business_member(supplier_business_id, auth.uid()))
  OR (carrier_business_id IS NOT NULL AND public.is_business_member(carrier_business_id, auth.uid()))
);
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  message_body TEXT,
  attachment_urls TEXT[] DEFAULT '{}',
  message_type public.message_type NOT NULL DEFAULT 'text',
  related_offer_id UUID REFERENCES public.custom_offers(id) ON DELETE SET NULL,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages via conversation" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (
    (c.buyer_business_id IS NOT NULL AND public.is_business_member(c.buyer_business_id, auth.uid()))
    OR (c.supplier_business_id IS NOT NULL AND public.is_business_member(c.supplier_business_id, auth.uid()))
    OR (c.carrier_business_id IS NOT NULL AND public.is_business_member(c.carrier_business_id, auth.uid()))
    OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "messages insert parties" ON public.messages FOR INSERT WITH CHECK (
  sender_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (
    (c.buyer_business_id IS NOT NULL AND public.is_business_member(c.buyer_business_id, auth.uid()))
    OR (c.supplier_business_id IS NOT NULL AND public.is_business_member(c.supplier_business_id, auth.uid()))
    OR (c.carrier_business_id IS NOT NULL AND public.is_business_member(c.carrier_business_id, auth.uid()))))
);

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type public.notification_type NOT NULL DEFAULT 'system',
  related_type TEXT,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications visible owner" ON public.notifications FOR SELECT USING (
  user_id = auth.uid()
  OR (business_id IS NOT NULL AND public.is_business_member(business_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
-- Any authenticated user can create a notification aimed at another user (workflow needs this).
CREATE POLICY "notifications insert" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications update own" ON public.notifications FOR UPDATE USING (
  user_id = auth.uid() OR (business_id IS NOT NULL AND public.is_business_member(business_id, auth.uid()))
);

-- ============================================================
-- reviews
-- ============================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reviewer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reviewed_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews insert reviewer" ON public.reviews FOR INSERT
  WITH CHECK (public.is_business_member(reviewer_business_id, auth.uid()));

-- ============================================================
-- attachments
-- ============================================================
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  related_type TEXT,
  related_id UUID,
  file_name TEXT,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments visible owner or biz" ON public.attachments FOR SELECT USING (
  owner_user_id = auth.uid()
  OR (business_id IS NOT NULL AND public.is_business_member(business_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "attachments insert owner" ON public.attachments FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "attachments delete owner" ON public.attachments FOR DELETE USING (owner_user_id = auth.uid());

-- ============================================================
-- verification_documents
-- ============================================================
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT,
  status public.verification_doc_status NOT NULL DEFAULT 'pending',
  reviewed_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.verification_documents TO authenticated;
GRANT ALL ON public.verification_documents TO service_role;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif docs visible members or admin" ON public.verification_documents FOR SELECT USING (
  public.is_business_member(business_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "verif docs insert members" ON public.verification_documents FOR INSERT WITH CHECK (
  public.is_business_member(business_id, auth.uid())
);
CREATE POLICY "verif docs admin update" ON public.verification_documents FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
);

-- ============================================================
-- audit_logs
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs admin read" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR actor_user_id = auth.uid());
CREATE POLICY "audit_logs insert self" ON public.audit_logs FOR INSERT WITH CHECK (actor_user_id = auth.uid() OR actor_user_id IS NULL);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
