-- Remove email-confirmation-pending accounts after their first 24 hours.
-- Deleting auth.users cascades to profiles, consent entries, and related user data.
CREATE OR REPLACE FUNCTION public.delete_expired_unconfirmed_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, auth
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at <= now() - interval '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_expired_unconfirmed_users() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE existing_job record;
BEGIN
  FOR existing_job IN
    SELECT jobid FROM cron.job WHERE jobname = 'delete-expired-unconfirmed-users'
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'delete-expired-unconfirmed-users',
    '*/5 * * * *',
    'SELECT public.delete_expired_unconfirmed_users();'
  );
END;
$$;
