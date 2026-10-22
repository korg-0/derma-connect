-- Reserve confirmed addresses by digest so deleting an account does not make
-- that verified address available to a future signup.
CREATE TABLE IF NOT EXISTS public.confirmed_email_reservations (
  email_hash bytea PRIMARY KEY,
  reserved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.confirmed_email_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.confirmed_email_reservations FROM PUBLIC, anon, authenticated;

INSERT INTO public.confirmed_email_reservations (email_hash)
SELECT DISTINCT extensions.digest(lower(btrim(email)), 'sha256')
FROM auth.users
WHERE email IS NOT NULL AND email_confirmed_at IS NOT NULL
ON CONFLICT (email_hash) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reject_reuse_of_confirmed_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.confirmed_email_reservations r
       WHERE r.email_hash = extensions.digest(lower(btrim(NEW.email)), 'sha256')
     ) THEN
    RAISE EXCEPTION 'This email address has already been used by a confirmed account';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_confirmed_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.confirmed_email_reservations (email_hash)
    VALUES (extensions.digest(lower(btrim(NEW.email)), 'sha256'))
    ON CONFLICT (email_hash) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_reuse_of_confirmed_email ON auth.users;
CREATE TRIGGER reject_reuse_of_confirmed_email
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.reject_reuse_of_confirmed_email();

DROP TRIGGER IF EXISTS reserve_confirmed_email_after_signup ON auth.users;
CREATE TRIGGER reserve_confirmed_email_after_signup
  AFTER INSERT OR UPDATE OF email_confirmed_at, email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.reserve_confirmed_email();
REVOKE ALL ON FUNCTION public.reject_reuse_of_confirmed_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_confirmed_email() FROM PUBLIC, anon, authenticated;

-- Only an authenticated patient can delete their own auth account. Existing
-- FK cascades remove the profile and patient medical/consultation records.
CREATE OR REPLACE FUNCTION public.delete_own_patient_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in before deleting your account';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = current_user_id AND role = 'patient'
  ) THEN
    RAISE EXCEPTION 'Only patient accounts can be deleted from this page';
  END IF;

  IF EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'skin-images'
      AND (storage.foldername(name))[1] = current_user_id::text
  ) THEN
    RAISE EXCEPTION 'Remove uploaded images before deleting the account';
  END IF;

  DELETE FROM auth.users WHERE id = current_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account was not found';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_own_patient_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_patient_account() TO authenticated;

-- Permit account owners to enumerate and remove only files in their own
-- storage folder before their auth row is deleted.
DROP POLICY IF EXISTS "Verified participants view consultation images" ON storage.objects;
DROP POLICY IF EXISTS "Users view own and verified consultation images" ON storage.objects;
CREATE POLICY "Users view own and verified consultation images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'skin-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.consultation_images ci
        JOIN public.consultations c ON c.id = ci.consultation_id
        WHERE ci.storage_path = name
          AND (
            c.patient_id = auth.uid()
            OR (c.doctor_id = auth.uid() AND public.is_verified_doctor(auth.uid()))
          )
      )
    )
  );

DROP POLICY IF EXISTS "Users delete own consultation images" ON storage.objects;
CREATE POLICY "Users delete own consultation images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'skin-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
