
REVOKE SELECT (contact_email, contact_phone) ON public.businesses FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.business_contact_info(_business_id uuid)
RETURNS TABLE(contact_email text, contact_phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.contact_email, b.contact_phone
  FROM public.businesses b
  WHERE b.id = _business_id
    AND (public.is_business_member(b.id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
$$;
REVOKE EXECUTE ON FUNCTION public.business_contact_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_contact_info(uuid) TO authenticated;

DROP POLICY IF EXISTS "profiles readable to all" ON public.profiles;
CREATE POLICY "profiles readable to owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "shipments write parties" ON public.shipments;
CREATE POLICY "shipments write parties"
  ON public.shipments FOR ALL
  USING (
    ((carrier_business_id IS NOT NULL) AND public.is_business_member(carrier_business_id, auth.uid()))
    OR (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = shipments.order_id
        AND (public.is_business_member(o.buyer_business_id, auth.uid())
             OR public.is_business_member(o.supplier_business_id, auth.uid()))))
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    ((carrier_business_id IS NOT NULL) AND public.is_business_member(carrier_business_id, auth.uid()))
    OR (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = shipments.order_id
        AND (public.is_business_member(o.buyer_business_id, auth.uid())
             OR public.is_business_member(o.supplier_business_id, auth.uid()))))
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_business_ids(uuid) FROM PUBLIC, anon, authenticated;
