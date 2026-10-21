-- Initial hosted Supabase schema and access setup for DermaConnect.
--
-- PostgreSQL database dump
--




--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: cleanup_expired_requests(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_requests() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  expired_rec RECORD;
BEGIN
  -- Loop through expired consultations
  FOR expired_rec IN 
    SELECT id, slot_id 
    FROM public.consultations 
    WHERE status = 'approved_awaiting_payment' 
      AND approved_at < NOW() - INTERVAL '6 hours'
  LOOP
    -- 1. Free the slot
    IF expired_rec.slot_id IS NOT NULL THEN
      UPDATE public.doctor_slots 
      SET is_booked = false 
      WHERE id = expired_rec.slot_id;
    END IF;

    -- 2. Cancel the consultation
    UPDATE public.consultations
    SET status = 'cancelled', slot_id = NULL, doctor_id = NULL
    WHERE id = expired_rec.id;

  END LOOP;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email
  );
  return new;
end;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;


--
-- Name: update_doctor_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_doctor_rating() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.profiles
  set 
    average_rating = (
      select round(avg(rating)::numeric, 2) from public.ratings where doctor_id = new.doctor_id
    ),
    total_ratings = (
      select count(*) from public.ratings where doctor_id = new.doctor_id
    )
  where id = new.doctor_id;
  return new;
end;
$$;




--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    resource_type text,
    resource_id uuid,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: consent_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    consent_type text NOT NULL,
    granted boolean NOT NULL,
    version text NOT NULL,
    ip_address text,
    user_agent text,
    granted_at timestamp with time zone DEFAULT now(),
    document_version text DEFAULT '1.0'::text
);


--
-- Name: consultation_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultation_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultation_id uuid,
    storage_path text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: consultations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    doctor_id uuid,
    slot_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    symptoms_text text NOT NULL,
    scheduled_at timestamp with time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    diagnosis text,
    doctor_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    meeting_link text,
    approved_at timestamp with time zone,
    CONSTRAINT consultations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'pending_approval'::text, 'approved_awaiting_payment'::text, 'scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: doctor_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    doctor_id uuid,
    slot_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_booked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: google_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_tokens (
    doctor_id uuid NOT NULL,
    refresh_token text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: medical_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    allergies text[],
    current_medications text[],
    past_conditions text[],
    surgeries text[],
    family_history text,
    notes text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultation_id uuid,
    sender_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultation_id uuid,
    doctor_id uuid,
    patient_id uuid,
    medications jsonb NOT NULL,
    instructions text,
    issued_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text,
    CONSTRAINT prescriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role text NOT NULL,
    full_name text NOT NULL,
    email text,
    phone text,
    date_of_birth date,
    gender text,
    qualifications text,
    registration_number text,
    specializations text[],
    experience_years integer,
    consultation_fee numeric(10,2),
    bio text,
    verified boolean DEFAULT false,
    average_rating numeric(3,2) DEFAULT 0,
    total_ratings integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['patient'::text, 'doctor'::text, 'admin'::text])))
);


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultation_id uuid,
    patient_id uuid,
    doctor_id uuid,
    rating integer NOT NULL,
    review_text text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: consent_log consent_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_log
    ADD CONSTRAINT consent_log_pkey PRIMARY KEY (id);


--
-- Name: consultation_images consultation_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_images
    ADD CONSTRAINT consultation_images_pkey PRIMARY KEY (id);


--
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- Name: doctor_slots doctor_slots_doctor_id_slot_date_start_time_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_slots
    ADD CONSTRAINT doctor_slots_doctor_id_slot_date_start_time_key UNIQUE (doctor_id, slot_date, start_time);


--
-- Name: doctor_slots doctor_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_slots
    ADD CONSTRAINT doctor_slots_pkey PRIMARY KEY (id);


--
-- Name: google_tokens google_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_tokens
    ADD CONSTRAINT google_tokens_pkey PRIMARY KEY (doctor_id);


--
-- Name: medical_history medical_history_patient_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_patient_id_key UNIQUE (patient_id);


--
-- Name: medical_history medical_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_consultation_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_consultation_id_key UNIQUE (consultation_id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: audit_log_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_created_idx ON public.audit_log USING btree (created_at DESC);


--
-- Name: audit_log_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_user_idx ON public.audit_log USING btree (user_id);


--
-- Name: consent_log_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consent_log_user_idx ON public.consent_log USING btree (user_id);


--
-- Name: consultation_images_consultation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consultation_images_consultation_idx ON public.consultation_images USING btree (consultation_id);


--
-- Name: consultations_doctor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consultations_doctor_idx ON public.consultations USING btree (doctor_id);


--
-- Name: consultations_patient_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consultations_patient_idx ON public.consultations USING btree (patient_id);


--
-- Name: consultations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consultations_status_idx ON public.consultations USING btree (status);


--
-- Name: doctor_slots_available_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctor_slots_available_idx ON public.doctor_slots USING btree (doctor_id, slot_date) WHERE (is_booked = false);


--
-- Name: idx_consent_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_user_type ON public.consent_log USING btree (user_id, consent_type);


--
-- Name: prescriptions_patient_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX prescriptions_patient_idx ON public.prescriptions USING btree (patient_id);


--
-- Name: profiles_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_role_idx ON public.profiles USING btree (role);


--
-- Name: profiles_verified_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_verified_idx ON public.profiles USING btree (verified) WHERE (role = 'doctor'::text);


--
-- Name: ratings_doctor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ratings_doctor_idx ON public.ratings USING btree (doctor_id);


--
-- Name: ratings on_rating_inserted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_rating_inserted AFTER INSERT OR UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.update_doctor_rating();


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: consent_log consent_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_log
    ADD CONSTRAINT consent_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: consultation_images consultation_images_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_images
    ADD CONSTRAINT consultation_images_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;


--
-- Name: consultations consultations_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: consultations consultations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: consultations consultations_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.doctor_slots(id) ON DELETE SET NULL;


--
-- Name: doctor_slots doctor_slots_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_slots
    ADD CONSTRAINT doctor_slots_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: google_tokens google_tokens_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_tokens
    ADD CONSTRAINT google_tokens_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: medical_history medical_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());


--
-- Name: ratings Anyone can read ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read ratings" ON public.ratings FOR SELECT USING (true);


--
-- Name: doctor_slots Anyone can read slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read slots" ON public.doctor_slots FOR SELECT USING (true);


--
-- Name: profiles Anyone can read verified doctor profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read verified doctor profiles" ON public.profiles FOR SELECT USING (((role = 'doctor'::text) AND (verified = true)));


--
-- Name: prescriptions Doctors can update prescriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors can update prescriptions" ON public.prescriptions FOR UPDATE USING ((auth.uid() = doctor_id));


--
-- Name: profiles Doctors can view their patients' profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors can view their patients' profiles" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.consultations c
  WHERE ((c.patient_id = profiles.id) AND (c.doctor_id = auth.uid())))));


--
-- Name: prescriptions Doctors issue prescriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors issue prescriptions" ON public.prescriptions FOR INSERT WITH CHECK ((auth.uid() = doctor_id));


--
-- Name: doctor_slots Doctors manage own slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors manage own slots" ON public.doctor_slots USING ((auth.uid() = doctor_id));


--
-- Name: google_tokens Doctors manage own tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors manage own tokens" ON public.google_tokens USING ((auth.uid() = doctor_id));


--
-- Name: medical_history Doctors read history of their patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors read history of their patients" ON public.medical_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.consultations c
  WHERE ((c.patient_id = medical_history.patient_id) AND (c.doctor_id = auth.uid())))));


--
-- Name: consultations Doctors see assigned consultations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors see assigned consultations" ON public.consultations FOR SELECT USING ((auth.uid() = doctor_id));


--
-- Name: prescriptions Doctors see prescriptions they issued; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors see prescriptions they issued" ON public.prescriptions FOR SELECT USING ((auth.uid() = doctor_id));


--
-- Name: consultations Doctors update assigned consultations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Doctors update assigned consultations" ON public.consultations FOR UPDATE USING ((auth.uid() = doctor_id));


--
-- Name: consultation_images Images visible to consultation participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Images visible to consultation participants" ON public.consultation_images FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.consultations c
  WHERE ((c.id = consultation_images.consultation_id) AND ((c.patient_id = auth.uid()) OR (c.doctor_id = auth.uid()))))));


--
-- Name: messages Participants can insert messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can insert messages" ON public.messages FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.consultations c
  WHERE ((c.id = messages.consultation_id) AND ((c.patient_id = auth.uid()) OR (c.doctor_id = auth.uid()))))) AND (sender_id = auth.uid())));


--
-- Name: messages Participants can read messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.consultations c
  WHERE ((c.id = messages.consultation_id) AND ((c.patient_id = auth.uid()) OR (c.doctor_id = auth.uid()))))));


--
-- Name: doctor_slots Patients book available slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients book available slots" ON public.doctor_slots FOR UPDATE USING ((is_booked = false)) WITH CHECK ((is_booked = true));


--
-- Name: consultations Patients can cancel own pending consultations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can cancel own pending consultations" ON public.consultations FOR UPDATE USING (((auth.uid() = patient_id) AND (status = 'pending'::text)));


--
-- Name: consultations Patients can request slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can request slots" ON public.consultations FOR UPDATE USING ((auth.uid() = patient_id)) WITH CHECK ((auth.uid() = patient_id));


--
-- Name: consultations Patients create consultations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients create consultations" ON public.consultations FOR INSERT WITH CHECK ((auth.uid() = patient_id));


--
-- Name: consultation_images Patients insert own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients insert own images" ON public.consultation_images FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.consultations c
  WHERE ((c.id = consultation_images.consultation_id) AND (c.patient_id = auth.uid())))));


--
-- Name: medical_history Patients manage own medical history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients manage own medical history" ON public.medical_history USING ((auth.uid() = patient_id));


--
-- Name: consultations Patients see own consultations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients see own consultations" ON public.consultations FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: prescriptions Patients see own prescriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients see own prescriptions" ON public.prescriptions FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: ratings Patients submit ratings after completed consultation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients submit ratings after completed consultation" ON public.ratings FOR INSERT WITH CHECK (((auth.uid() = patient_id) AND (EXISTS ( SELECT 1
   FROM public.consultations c
  WHERE ((c.id = ratings.consultation_id) AND (c.patient_id = auth.uid()) AND (c.status = 'completed'::text))))));


--
-- Name: audit_log System can insert audit records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit records" ON public.audit_log FOR INSERT WITH CHECK (true);


--
-- Name: consent_log Users can log own consent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can log own consent" ON public.consent_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: consent_log Users log own consent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users log own consent" ON public.consent_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: audit_log Users see own audit trail; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own audit trail" ON public.audit_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: consent_log Users see own consent records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own consent records" ON public.consent_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: consent_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

--
-- Name: consultation_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consultation_images ENABLE ROW LEVEL SECURITY;

--
-- Name: consultations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

--
-- Name: doctor_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.doctor_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: google_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: medical_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: prescriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

-- Restrict admin-only profile fields and unauthenticated access.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE requested_role text;
BEGIN
  requested_role := new.raw_user_meta_data->>'role';
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    new.id,
    CASE WHEN requested_role IN ('patient', 'doctor') THEN requested_role ELSE 'patient' END,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.verified IS DISTINCT FROM OLD.verified)
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an admin may change profile role or verification status';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

DROP POLICY IF EXISTS "System can insert audit records" ON public.audit_log;
CREATE POLICY "Users can insert own audit records"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Slot booking is represented by a consultation request. Only the assigned
-- doctor should change slot rows; clients must not be able to claim arbitrary
-- available slots directly.
DROP POLICY IF EXISTS "Patients book available slots" ON public.doctor_slots;

REVOKE ALL ON FUNCTION public.cleanup_expired_requests() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO storage.buckets (id, name, "public")
VALUES ('skin-images', 'skin-images', false)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "public" = EXCLUDED."public";

DROP POLICY IF EXISTS "Patients upload own consultation images" ON storage.objects;
CREATE POLICY "Patients upload own consultation images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'skin-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND c.patient_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants view consultation images" ON storage.objects;
CREATE POLICY "Participants view consultation images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'skin-images'
    AND EXISTS (
      SELECT 1
      FROM public.consultation_images ci
      JOIN public.consultations c ON c.id = ci.consultation_id
      WHERE ci.storage_path = name
        AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-consultations'
  ) THEN
    PERFORM cron.schedule(
      'cleanup-expired-consultations',
      '*/5 * * * *',
      'SELECT public.cleanup_expired_requests();'
    );
  END IF;
END;
$$;
