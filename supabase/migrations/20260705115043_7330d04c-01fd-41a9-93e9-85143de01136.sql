
ALTER TABLE public.businesses ALTER COLUMN owner_user_id DROP NOT NULL;

-- Update owner-member trigger to skip when no owner
CREATE OR REPLACE FUNCTION public.tg_add_owner_member() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.business_members (business_id, user_id, role_in_business)
    VALUES (NEW.id, NEW.owner_user_id, 'owner') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
