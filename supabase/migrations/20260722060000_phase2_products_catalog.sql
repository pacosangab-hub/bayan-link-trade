-- ============================================================
-- Phase 2 — Products, images, MOQ tiers, inventory, moderation
-- Additive. Preserves existing products columns for compatibility.
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- ---------- Categories seed (idempotent by slug) ----------
INSERT INTO public.categories (name, slug, industry_group, icon, sort_order) VALUES
  ('Rice & Grains', 'rice-grains', 'Agriculture & Fresh Produce', '🌾', 1),
  ('Vegetables', 'vegetables', 'Agriculture & Fresh Produce', '🥬', 2),
  ('Coffee', 'coffee', 'Beverages', '☕', 3),
  ('Boxes & Cartons', 'boxes-cartons', 'Packaging Materials', '📦', 4),
  ('Cleaning Solutions', 'cleaning-solutions', 'Cleaning & Hygiene', '🧴', 5),
  ('Cement', 'cement', 'Construction Materials', '🧱', 6),
  ('PPE & Consumables', 'ppe-consumables', 'Medical Supplies & Devices', '🩺', 7),
  ('General', 'general', 'Food Manufacturing & FMCG', '🏷️', 99)
ON CONFLICT (slug) DO NOTHING;

-- ---------- product_images ----------
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, sort_order);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images public read" ON public.product_images;
CREATE POLICY "product_images public read" ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND (
          (p.is_active AND p.listing_status = 'active')
          OR public.is_business_member(p.supplier_business_id, auth.uid())
          OR public.has_admin_role(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "product_images supplier write" ON public.product_images;
CREATE POLICY "product_images supplier write" ON public.product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  );

-- ---------- product_moq_tiers ----------
CREATE TABLE IF NOT EXISTS public.product_moq_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_qty INT NOT NULL CHECK (min_qty > 0),
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, min_qty)
);
CREATE INDEX IF NOT EXISTS idx_product_moq_tiers_product ON public.product_moq_tiers(product_id, min_qty);
GRANT SELECT ON public.product_moq_tiers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_moq_tiers TO authenticated;
GRANT ALL ON public.product_moq_tiers TO service_role;
ALTER TABLE public.product_moq_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_moq_tiers public read" ON public.product_moq_tiers;
CREATE POLICY "product_moq_tiers public read" ON public.product_moq_tiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_moq_tiers.product_id
        AND (
          (p.is_active AND p.listing_status = 'active')
          OR public.is_business_member(p.supplier_business_id, auth.uid())
          OR public.has_admin_role(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "product_moq_tiers supplier write" ON public.product_moq_tiers;
CREATE POLICY "product_moq_tiers supplier write" ON public.product_moq_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_moq_tiers.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_moq_tiers.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  );

-- ---------- product_inventory ----------
CREATE TABLE IF NOT EXISTS public.product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  available NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (available >= 0),
  reserved NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  incoming NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (incoming >= 0),
  unit TEXT,
  low_stock_threshold NUMERIC(14,2) NOT NULL DEFAULT 0,
  tracking_type TEXT NOT NULL DEFAULT 'tracked' CHECK (tracking_type IN ('tracked', 'made_to_order', 'unlimited')),
  paused BOOLEAN NOT NULL DEFAULT false,
  restock_date DATE,
  lead_time TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_inventory TO anon, authenticated;
GRANT INSERT, UPDATE ON public.product_inventory TO authenticated;
GRANT ALL ON public.product_inventory TO service_role;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_product_inventory_updated ON public.product_inventory;
CREATE TRIGGER trg_product_inventory_updated BEFORE UPDATE ON public.product_inventory
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP POLICY IF EXISTS "product_inventory public read" ON public.product_inventory;
CREATE POLICY "product_inventory public read" ON public.product_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_inventory.product_id
        AND (
          (p.is_active AND p.listing_status = 'active')
          OR public.is_business_member(p.supplier_business_id, auth.uid())
          OR public.has_admin_role(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "product_inventory supplier write" ON public.product_inventory;
CREATE POLICY "product_inventory supplier write" ON public.product_inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_inventory.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_inventory.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  );

CREATE TABLE IF NOT EXISTS public.product_inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('adjust', 'reserve', 'release', 'complete', 'restock', 'sale')),
  quantity NUMERIC(14,2) NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_inventory_movements_product ON public.product_inventory_movements(product_id, created_at DESC);
GRANT SELECT, INSERT ON public.product_inventory_movements TO authenticated;
GRANT ALL ON public.product_inventory_movements TO service_role;
ALTER TABLE public.product_inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_inventory_movements member read" ON public.product_inventory_movements;
CREATE POLICY "product_inventory_movements member read" ON public.product_inventory_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_inventory_movements.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "product_inventory_movements member insert" ON public.product_inventory_movements;
CREATE POLICY "product_inventory_movements member insert" ON public.product_inventory_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_inventory_movements.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  );

-- ---------- product_documents ----------
CREATE TABLE IF NOT EXISTS public.product_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'other',
  file_name TEXT,
  file_url TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_documents_product ON public.product_documents(product_id);
GRANT SELECT ON public.product_documents TO authenticated;
GRANT INSERT, DELETE ON public.product_documents TO authenticated;
GRANT ALL ON public.product_documents TO service_role;
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_documents party read" ON public.product_documents;
CREATE POLICY "product_documents party read" ON public.product_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_documents.product_id
        AND (
          (p.is_active AND p.listing_status = 'active')
          OR public.is_business_member(p.supplier_business_id, auth.uid())
          OR public.has_admin_role(auth.uid())
          OR public.has_permission(auth.uid(), 'products.read')
        )
    )
  );

DROP POLICY IF EXISTS "product_documents supplier write" ON public.product_documents;
CREATE POLICY "product_documents supplier write" ON public.product_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_documents.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_documents.product_id
        AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
    )
  );

-- Keep denormalized products.images in sync when image rows change
CREATE OR REPLACE FUNCTION public.tg_sync_product_images_array()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pid UUID := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE public.products p
  SET images = COALESCE((
    SELECT array_agg(pi.image_url ORDER BY pi.sort_order, pi.created_at)
    FROM public.product_images pi WHERE pi.product_id = _pid
  ), '{}'),
  updated_at = now()
  WHERE p.id = _pid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_product_images_sync ON public.product_images;
CREATE TRIGGER trg_product_images_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_product_images_array();

-- ---------- Marketplace list RPC ----------
CREATE OR REPLACE FUNCTION public.list_marketplace_products(
  _search TEXT DEFAULT NULL,
  _category_slug TEXT DEFAULT NULL,
  _limit INT DEFAULT 100,
  _offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows JSONB;
BEGIN
  SELECT coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb)
  INTO _rows
  FROM (
    SELECT
      p.id,
      p.title,
      p.description,
      p.unit,
      p.minimum_order_quantity AS moq,
      p.fixed_price,
      p.price_min,
      p.price_max,
      p.price_type,
      p.images,
      p.lead_time,
      p.location,
      p.region,
      p.stock_status,
      p.listing_status,
      p.compliance_status,
      p.tags,
      p.is_featured,
      p.rating,
      p.total_orders,
      p.brand,
      p.sku,
      p.created_at,
      p.updated_at,
      c.name AS category_name,
      c.slug AS category_slug,
      c.industry_group,
      b.id AS supplier_business_id,
      b.business_name AS supplier_name,
      b.verification_status AS supplier_verification_status,
      b.location AS supplier_location,
      b.region AS supplier_region,
      b.rating AS supplier_rating,
      sp.is_gold_supplier,
      coalesce((
        SELECT jsonb_agg(jsonb_build_object('qty', t.min_qty, 'price', t.unit_price) ORDER BY t.min_qty)
        FROM public.product_moq_tiers t WHERE t.product_id = p.id
      ), '[]'::jsonb) AS tier_pricing,
      inv.available AS inventory_available,
      inv.tracking_type AS inventory_tracking_type,
      inv.paused AS inventory_paused
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    JOIN public.businesses b ON b.id = p.supplier_business_id
    LEFT JOIN public.supplier_profiles sp ON sp.business_id = b.id
    LEFT JOIN public.product_inventory inv ON inv.product_id = p.id
    WHERE p.is_active = true
      AND p.listing_status = 'active'
      AND (
        _search IS NULL OR _search = '' OR
        p.title ILIKE '%' || _search || '%' OR
        p.description ILIKE '%' || _search || '%' OR
        b.business_name ILIKE '%' || _search || '%'
      )
      AND (
        _category_slug IS NULL OR _category_slug = '' OR c.slug = _category_slug OR c.name ILIKE _category_slug
      )
    ORDER BY p.is_featured DESC, p.created_at DESC
    LIMIT GREATEST(1, LEAST(coalesce(_limit, 100), 200))
    OFFSET GREATEST(0, coalesce(_offset, 0))
  ) x;

  RETURN _rows;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.list_marketplace_products(text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_marketplace_products(text, text, int, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_product_detail(_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row JSONB;
  _can_view BOOLEAN;
BEGIN
  SELECT
    (p.is_active AND p.listing_status = 'active')
    OR public.is_business_member(p.supplier_business_id, auth.uid())
    OR public.has_admin_role(auth.uid())
    OR public.has_permission(auth.uid(), 'products.read')
  INTO _can_view
  FROM public.products p WHERE p.id = _product_id;

  IF _can_view IS DISTINCT FROM true THEN
    RETURN NULL;
  END IF;

  SELECT row_to_json(x)::jsonb INTO _row
  FROM (
    SELECT
      p.*,
      c.name AS category_name,
      c.slug AS category_slug,
      c.industry_group,
      b.business_name AS supplier_name,
      b.verification_status AS supplier_verification_status,
      b.location AS supplier_location,
      b.region AS supplier_region,
      b.rating AS supplier_rating,
      b.description AS supplier_description,
      sp.is_gold_supplier,
      sp.years_operating,
      coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', pi.id, 'image_url', pi.image_url, 'sort_order', pi.sort_order, 'alt_text', pi.alt_text
        ) ORDER BY pi.sort_order, pi.created_at)
        FROM public.product_images pi WHERE pi.product_id = p.id
      ), '[]'::jsonb) AS image_rows,
      coalesce((
        SELECT jsonb_agg(jsonb_build_object('qty', t.min_qty, 'price', t.unit_price) ORDER BY t.min_qty)
        FROM public.product_moq_tiers t WHERE t.product_id = p.id
      ), '[]'::jsonb) AS tier_pricing,
      (
        SELECT row_to_json(inv)::jsonb FROM public.product_inventory inv WHERE inv.product_id = p.id
      ) AS inventory
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    JOIN public.businesses b ON b.id = p.supplier_business_id
    LEFT JOIN public.supplier_profiles sp ON sp.business_id = b.id
    WHERE p.id = _product_id
  ) x;

  RETURN _row;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_product_detail(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_detail(uuid) TO anon, authenticated;

-- ---------- Supplier upsert product ----------
CREATE OR REPLACE FUNCTION public.upsert_supplier_product(
  _payload JSONB,
  _product_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _business_id UUID;
  _category_id UUID;
  _id UUID;
  _status public.product_listing_status;
  _price_type public.product_price_type;
  _images TEXT[];
  _tiers JSONB;
  _img TEXT;
  _i INT := 0;
  _tier JSONB;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  _business_id := NULLIF(_payload->>'supplier_business_id', '')::uuid;
  IF _business_id IS NULL THEN
    SELECT bm.business_id INTO _business_id
    FROM public.business_members bm
    JOIN public.businesses b ON b.id = bm.business_id
    WHERE bm.user_id = _uid AND b.is_supplier = true
    ORDER BY bm.created_at
    LIMIT 1;
  END IF;

  IF _business_id IS NULL OR NOT public.is_business_member(_business_id, _uid) THEN
    RAISE EXCEPTION 'supplier business required';
  END IF;

  IF coalesce(trim(_payload->>'title'), '') = '' THEN
    RAISE EXCEPTION 'title required';
  END IF;

  SELECT id INTO _category_id FROM public.categories
  WHERE slug = _payload->>'category_slug'
     OR name ILIKE coalesce(_payload->>'category_name', '')
  LIMIT 1;

  _status := coalesce((_payload->>'listing_status')::public.product_listing_status, 'draft');
  IF _status = 'active' AND coalesce((_payload->>'requires_review')::boolean, false) THEN
    _status := 'pending_review';
  END IF;

  _price_type := CASE coalesce(_payload->>'price_type', 'fixed')
    WHEN 'quote' THEN 'quote_only'::public.product_price_type
    WHEN 'quote_only' THEN 'quote_only'::public.product_price_type
    WHEN 'range' THEN 'range'::public.product_price_type
    ELSE 'fixed'::public.product_price_type
  END;

  IF _product_id IS NULL THEN
    INSERT INTO public.products (
      supplier_business_id, category_id, title, description, unit, minimum_order_quantity,
      fixed_price, price_min, price_max, price_type, lead_time, location, region,
      stock_status, listing_status, compliance_status, tags, service_regions,
      brand, sku, is_active, images
    ) VALUES (
      _business_id,
      _category_id,
      trim(_payload->>'title'),
      NULLIF(_payload->>'description', ''),
      NULLIF(_payload->>'unit', ''),
      coalesce((_payload->>'moq')::int, 1),
      NULLIF(_payload->>'fixed_price', '')::numeric,
      NULLIF(_payload->>'price_min', '')::numeric,
      NULLIF(_payload->>'price_max', '')::numeric,
      _price_type,
      NULLIF(_payload->>'lead_time', ''),
      NULLIF(_payload->>'location', ''),
      NULLIF(_payload->>'region', ''),
      coalesce((_payload->>'stock_status')::public.product_stock_status, 'in_stock'),
      _status,
      coalesce((_payload->>'compliance_status')::public.product_compliance_status, 'no_review_needed'),
      coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(_payload->'tags', '[]'::jsonb))), '{}'),
      coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(_payload->'service_regions', '[]'::jsonb))), '{}'),
      NULLIF(_payload->>'brand', ''),
      NULLIF(_payload->>'sku', ''),
      (_status = 'active'),
      '{}'
    )
    RETURNING id INTO _id;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = _product_id AND public.is_business_member(p.supplier_business_id, _uid)
    ) THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
    UPDATE public.products SET
      category_id = COALESCE(_category_id, category_id),
      title = trim(_payload->>'title'),
      description = COALESCE(NULLIF(_payload->>'description', ''), description),
      unit = COALESCE(NULLIF(_payload->>'unit', ''), unit),
      minimum_order_quantity = coalesce((_payload->>'moq')::int, minimum_order_quantity),
      fixed_price = COALESCE(NULLIF(_payload->>'fixed_price', '')::numeric, fixed_price),
      price_min = COALESCE(NULLIF(_payload->>'price_min', '')::numeric, price_min),
      price_max = COALESCE(NULLIF(_payload->>'price_max', '')::numeric, price_max),
      price_type = _price_type,
      lead_time = COALESCE(NULLIF(_payload->>'lead_time', ''), lead_time),
      location = COALESCE(NULLIF(_payload->>'location', ''), location),
      region = COALESCE(NULLIF(_payload->>'region', ''), region),
      listing_status = _status,
      is_active = (_status = 'active'),
      brand = COALESCE(NULLIF(_payload->>'brand', ''), brand),
      sku = COALESCE(NULLIF(_payload->>'sku', ''), sku),
      updated_at = now()
    WHERE id = _product_id
    RETURNING id INTO _id;
  END IF;

  -- Replace images if provided
  IF _payload ? 'images' THEN
    DELETE FROM public.product_images WHERE product_id = _id;
    _i := 0;
    FOR _img IN SELECT jsonb_array_elements_text(coalesce(_payload->'images', '[]'::jsonb))
    LOOP
      IF trim(_img) <> '' THEN
        INSERT INTO public.product_images (product_id, image_url, sort_order)
        VALUES (_id, trim(_img), _i);
        _i := _i + 1;
      END IF;
    END LOOP;
  END IF;

  -- Replace MOQ tiers if provided
  IF _payload ? 'tier_pricing' THEN
    DELETE FROM public.product_moq_tiers WHERE product_id = _id;
    FOR _tier IN SELECT * FROM jsonb_array_elements(coalesce(_payload->'tier_pricing', '[]'::jsonb))
    LOOP
      INSERT INTO public.product_moq_tiers (product_id, min_qty, unit_price, sort_order)
      VALUES (
        _id,
        coalesce((_tier->>'qty')::int, (_tier->>'min_qty')::int, 1),
        coalesce((_tier->>'price')::numeric, (_tier->>'unit_price')::numeric, 0),
        coalesce((_tier->>'sort_order')::int, 0)
      )
      ON CONFLICT (product_id, min_qty) DO UPDATE SET unit_price = EXCLUDED.unit_price;
    END LOOP;
  END IF;

  -- Ensure inventory row
  INSERT INTO public.product_inventory (product_id, available, unit, tracking_type, lead_time)
  VALUES (
    _id,
    coalesce((_payload->>'inventory_available')::numeric, 0),
    NULLIF(_payload->>'unit', ''),
    coalesce(_payload->>'inventory_tracking_type', 'tracked'),
    NULLIF(_payload->>'lead_time', '')
  )
  ON CONFLICT (product_id) DO UPDATE SET
    unit = COALESCE(EXCLUDED.unit, public.product_inventory.unit),
    lead_time = COALESCE(EXCLUDED.lead_time, public.product_inventory.lead_time),
    updated_at = now();

  PERFORM public.write_audit_log(
    CASE WHEN _product_id IS NULL THEN 'product_created' ELSE 'product_updated' END,
    'product',
    _id,
    jsonb_build_object('listing_status', _status, 'title', _payload->>'title'),
    _uid,
    _business_id
  );

  RETURN _id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.upsert_supplier_product(jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_supplier_product(jsonb, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_supplier_products()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _rows JSONB;
BEGIN
  IF _uid IS NULL THEN RETURN '[]'::jsonb; END IF;

  SELECT coalesce(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.updated_at DESC), '[]'::jsonb)
  INTO _rows
  FROM (
    SELECT
      p.*,
      c.name AS category_name,
      c.industry_group,
      b.business_name AS supplier_name,
      coalesce((
        SELECT jsonb_agg(jsonb_build_object('qty', t.min_qty, 'price', t.unit_price) ORDER BY t.min_qty)
        FROM public.product_moq_tiers t WHERE t.product_id = p.id
      ), '[]'::jsonb) AS tier_pricing,
      (SELECT row_to_json(inv)::jsonb FROM public.product_inventory inv WHERE inv.product_id = p.id) AS inventory
    FROM public.products p
    JOIN public.businesses b ON b.id = p.supplier_business_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE public.is_business_member(p.supplier_business_id, _uid)
  ) x;

  RETURN _rows;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.list_my_supplier_products() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_supplier_products() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_moderate_product(
  _product_id UUID,
  _listing_status public.product_listing_status,
  _review_notes TEXT DEFAULT NULL,
  _compliance_status public.product_compliance_status DEFAULT NULL,
  _is_featured BOOLEAN DEFAULT NULL
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
    public.has_permission(auth.uid(), 'products.moderate')
    OR public.has_admin_role(auth.uid())
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'listing_status', listing_status,
    'compliance_status', compliance_status,
    'review_notes', review_notes,
    'is_featured', is_featured
  ) INTO _before FROM public.products WHERE id = _product_id;

  UPDATE public.products SET
    listing_status = _listing_status,
    is_active = (_listing_status = 'active'),
    review_notes = COALESCE(_review_notes, review_notes),
    compliance_status = COALESCE(_compliance_status, compliance_status),
    is_featured = COALESCE(_is_featured, is_featured),
    moderated_by = auth.uid(),
    moderated_at = now(),
    updated_at = now()
  WHERE id = _product_id;

  PERFORM public.write_audit_log(
    'product_moderated',
    'product',
    _product_id,
    jsonb_build_object(
      'before', _before,
      'after', jsonb_build_object(
        'listing_status', _listing_status,
        'review_notes', _review_notes,
        'compliance_status', _compliance_status,
        'is_featured', _is_featured
      )
    ),
    auth.uid(),
    NULL
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_moderate_product(uuid, public.product_listing_status, text, public.product_compliance_status, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_product(uuid, public.product_listing_status, text, public.product_compliance_status, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_admin_products(
  _listing_status public.product_listing_status DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT (
    public.has_permission(auth.uid(), 'products.read')
    OR public.has_admin_role(auth.uid())
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT coalesce(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.updated_at DESC), '[]'::jsonb)
  INTO _rows
  FROM (
    SELECT
      p.*,
      c.name AS category_name,
      c.industry_group,
      b.business_name AS supplier_name
    FROM public.products p
    JOIN public.businesses b ON b.id = p.supplier_business_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE _listing_status IS NULL OR p.listing_status = _listing_status
  ) x;

  RETURN _rows;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.list_admin_products(public.product_listing_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admin_products(public.product_listing_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_product_inventory(
  _product_id UUID,
  _available NUMERIC DEFAULT NULL,
  _reserved NUMERIC DEFAULT NULL,
  _incoming NUMERIC DEFAULT NULL,
  _low_stock_threshold NUMERIC DEFAULT NULL,
  _tracking_type TEXT DEFAULT NULL,
  _paused BOOLEAN DEFAULT NULL,
  _restock_date DATE DEFAULT NULL,
  _lead_time TEXT DEFAULT NULL,
  _note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
  _before NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = _product_id
      AND (public.is_business_member(p.supplier_business_id, auth.uid()) OR public.has_admin_role(auth.uid()))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT available INTO _before FROM public.product_inventory WHERE product_id = _product_id;

  INSERT INTO public.product_inventory (
    product_id, available, reserved, incoming, low_stock_threshold, tracking_type, paused, restock_date, lead_time
  ) VALUES (
    _product_id,
    coalesce(_available, 0),
    coalesce(_reserved, 0),
    coalesce(_incoming, 0),
    coalesce(_low_stock_threshold, 0),
    coalesce(_tracking_type, 'tracked'),
    coalesce(_paused, false),
    _restock_date,
    _lead_time
  )
  ON CONFLICT (product_id) DO UPDATE SET
    available = COALESCE(_available, public.product_inventory.available),
    reserved = COALESCE(_reserved, public.product_inventory.reserved),
    incoming = COALESCE(_incoming, public.product_inventory.incoming),
    low_stock_threshold = COALESCE(_low_stock_threshold, public.product_inventory.low_stock_threshold),
    tracking_type = COALESCE(_tracking_type, public.product_inventory.tracking_type),
    paused = COALESCE(_paused, public.product_inventory.paused),
    restock_date = COALESCE(_restock_date, public.product_inventory.restock_date),
    lead_time = COALESCE(_lead_time, public.product_inventory.lead_time),
    updated_at = now()
  RETURNING id INTO _id;

  IF _available IS NOT NULL AND _available IS DISTINCT FROM _before THEN
    INSERT INTO public.product_inventory_movements (product_id, movement_type, quantity, note, created_by)
    VALUES (_product_id, 'adjust', _available - coalesce(_before, 0), _note, auth.uid());
  END IF;

  RETURN _id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.upsert_product_inventory(uuid, numeric, numeric, numeric, numeric, text, boolean, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_product_inventory(uuid, numeric, numeric, numeric, numeric, text, boolean, date, text, text) TO authenticated;
