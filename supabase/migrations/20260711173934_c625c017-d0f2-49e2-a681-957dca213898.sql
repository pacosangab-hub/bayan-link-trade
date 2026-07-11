
REVOKE EXECUTE ON FUNCTION public.business_contact_info(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.business_contact_info(uuid) TO service_role;
