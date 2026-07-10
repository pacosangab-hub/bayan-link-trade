
REVOKE EXECUTE ON FUNCTION public.business_contact_info(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_add_owner_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_rfq_quote_after_insert() FROM PUBLIC, anon, authenticated;
