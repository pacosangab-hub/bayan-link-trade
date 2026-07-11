
-- 1) businesses: hide contact_email/contact_phone from public SELECT via column grants
REVOKE SELECT ON public.businesses FROM anon, authenticated;
GRANT SELECT (
  id, business_name, business_type, owner_user_id, created_at, updated_at,
  rating, is_featured, is_carrier, is_supplier, is_buyer, verification_status,
  cover_url, logo_url, website, region, location, industry, description, slug
) ON public.businesses TO anon, authenticated;
-- Preserve write access previously granted by default
GRANT INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;

-- 2) notifications insert: require caller owns the target user_id or is a member of the target business
DROP POLICY IF EXISTS "notifications insert" ON public.notifications;
CREATE POLICY "notifications insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR (business_id IS NOT NULL AND public.is_business_member(business_id, auth.uid()))
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 3) storage: message-attachments read must be scoped to conversation parties
DROP POLICY IF EXISTS "Auth can read message attachments" ON storage.objects;
CREATE POLICY "Auth can read message attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id::text = split_part(name, '/', 1)
          AND (
               (c.buyer_business_id     IS NOT NULL AND public.is_business_member(c.buyer_business_id,     auth.uid()))
            OR (c.supplier_business_id  IS NOT NULL AND public.is_business_member(c.supplier_business_id,  auth.uid()))
            OR (c.carrier_business_id   IS NOT NULL AND public.is_business_member(c.carrier_business_id,   auth.uid()))
          )
      )
    )
  );

-- 4) SECURITY DEFINER function execute grants: revoke from signed-in users on internal helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid, uuid)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_business_ids(uuid)          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_add_owner_member()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_rfq_quote_after_insert()      FROM PUBLIC, anon, authenticated;

-- Keep the user-facing gated helper callable
GRANT EXECUTE ON FUNCTION public.business_contact_info(uuid) TO authenticated;
