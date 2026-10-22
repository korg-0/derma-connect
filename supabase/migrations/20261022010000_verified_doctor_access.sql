-- Central verified-doctor predicate for database policies and booking checks.
CREATE OR REPLACE FUNCTION public.is_verified_doctor(p_doctor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_doctor_id AND role = 'doctor' AND verified = true
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_verified_doctor(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.is_verified_doctor(uuid) FROM PUBLIC;

-- A consultation cannot be assigned to an unverified doctor or to another
-- doctor's slot, including when a client calls Supabase directly.
CREATE OR REPLACE FUNCTION public.enforce_verified_doctor_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE slot_doctor_id uuid;
BEGIN
  IF NEW.doctor_id IS NOT NULL AND NOT public.is_verified_doctor(NEW.doctor_id) THEN
    RAISE EXCEPTION 'Bookings require a verified doctor';
  END IF;

  IF NEW.slot_id IS NOT NULL THEN
    SELECT doctor_id INTO slot_doctor_id
    FROM public.doctor_slots
    WHERE id = NEW.slot_id;

    IF slot_doctor_id IS NULL
       OR slot_doctor_id IS DISTINCT FROM NEW.doctor_id
       OR NOT public.is_verified_doctor(slot_doctor_id) THEN
      RAISE EXCEPTION 'The selected slot must belong to a verified doctor';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_verified_doctor_booking ON public.consultations;
CREATE TRIGGER enforce_verified_doctor_booking
  BEFORE INSERT OR UPDATE OF doctor_id, slot_id ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_doctor_booking();
REVOKE ALL ON FUNCTION public.enforce_verified_doctor_booking() FROM PUBLIC, anon, authenticated;

-- Hide pending doctors' slots and allow only verified doctors to manage them.
DROP POLICY IF EXISTS "Anyone can read slots" ON public.doctor_slots;
DROP POLICY IF EXISTS "Doctors manage own slots" ON public.doctor_slots;
DROP POLICY IF EXISTS "Anyone can read slots for verified doctors" ON public.doctor_slots;
DROP POLICY IF EXISTS "Verified doctors manage own slots" ON public.doctor_slots;
CREATE POLICY "Anyone can read slots for verified doctors"
  ON public.doctor_slots FOR SELECT TO anon, authenticated
  USING (public.is_verified_doctor(doctor_id));
CREATE POLICY "Verified doctors manage own slots"
  ON public.doctor_slots FOR ALL TO authenticated
  USING (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()))
  WITH CHECK (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()));

-- Require verification for every doctor-side consultation operation.
DROP POLICY IF EXISTS "Doctors see assigned consultations" ON public.consultations;
DROP POLICY IF EXISTS "Verified doctors see assigned consultations" ON public.consultations;
CREATE POLICY "Verified doctors see assigned consultations"
  ON public.consultations FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()));
DROP POLICY IF EXISTS "Doctors update assigned consultations" ON public.consultations;
DROP POLICY IF EXISTS "Verified doctors update assigned consultations" ON public.consultations;
CREATE POLICY "Verified doctors update assigned consultations"
  ON public.consultations FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()))
  WITH CHECK (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()));

-- Protect doctor access to patient records, images, messages and prescriptions.
DROP POLICY IF EXISTS "Doctors can view their patients' profiles" ON public.profiles;
DROP POLICY IF EXISTS "Verified doctors can view their patients profiles" ON public.profiles;
CREATE POLICY "Verified doctors can view their patients profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.patient_id = profiles.id
        AND c.doctor_id = auth.uid()
        AND public.is_verified_doctor(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Doctors read history of their patients" ON public.medical_history;
DROP POLICY IF EXISTS "Verified doctors read history of their patients" ON public.medical_history;
CREATE POLICY "Verified doctors read history of their patients"
  ON public.medical_history FOR SELECT TO authenticated
  USING (
    public.is_verified_doctor(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.patient_id = medical_history.patient_id AND c.doctor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Images visible to consultation participants" ON public.consultation_images;
DROP POLICY IF EXISTS "Images visible to verified consultation participants" ON public.consultation_images;
CREATE POLICY "Images visible to verified consultation participants"
  ON public.consultation_images FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_images.consultation_id
        AND (
          c.patient_id = auth.uid()
          OR (c.doctor_id = auth.uid() AND public.is_verified_doctor(auth.uid()))
        )
    )
  );

DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Verified participants can read messages" ON public.messages;
CREATE POLICY "Verified participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = messages.consultation_id
        AND (
          c.patient_id = auth.uid()
          OR (c.doctor_id = auth.uid() AND public.is_verified_doctor(auth.uid()))
        )
    )
  );
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Verified participants can insert messages" ON public.messages;
CREATE POLICY "Verified participants can insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = messages.consultation_id
        AND (
          c.patient_id = auth.uid()
          OR (c.doctor_id = auth.uid() AND public.is_verified_doctor(auth.uid()))
        )
    )
  );

DROP POLICY IF EXISTS "Doctors issue prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Verified doctors issue prescriptions" ON public.prescriptions;
CREATE POLICY "Verified doctors issue prescriptions"
  ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = doctor_id
    AND public.is_verified_doctor(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
        AND c.doctor_id = auth.uid()
        AND c.patient_id = patient_id
    )
  );
DROP POLICY IF EXISTS "Doctors can update prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Verified doctors can update prescriptions" ON public.prescriptions;
CREATE POLICY "Verified doctors can update prescriptions"
  ON public.prescriptions FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()))
  WITH CHECK (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()));
DROP POLICY IF EXISTS "Doctors see prescriptions they issued" ON public.prescriptions;
DROP POLICY IF EXISTS "Verified doctors see prescriptions they issued" ON public.prescriptions;
CREATE POLICY "Verified doctors see prescriptions they issued"
  ON public.prescriptions FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()));

DROP POLICY IF EXISTS "Doctors manage own tokens" ON public.google_tokens;
DROP POLICY IF EXISTS "Verified doctors manage own tokens" ON public.google_tokens;
CREATE POLICY "Verified doctors manage own tokens"
  ON public.google_tokens FOR ALL TO authenticated
  USING (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()))
  WITH CHECK (auth.uid() = doctor_id AND public.is_verified_doctor(auth.uid()));

DROP POLICY IF EXISTS "Participants view consultation images" ON storage.objects;
DROP POLICY IF EXISTS "Verified participants view consultation images" ON storage.objects;
CREATE POLICY "Verified participants view consultation images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'skin-images'
    AND EXISTS (
      SELECT 1
      FROM public.consultation_images ci
      JOIN public.consultations c ON c.id = ci.consultation_id
      WHERE ci.storage_path = name
        AND (
          c.patient_id = auth.uid()
          OR (c.doctor_id = auth.uid() AND public.is_verified_doctor(auth.uid()))
        )
    )
  );
