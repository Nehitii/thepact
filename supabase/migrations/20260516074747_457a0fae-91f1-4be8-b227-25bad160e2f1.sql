CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.cron_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Lock down: revoke all from public/authenticated/anon
REVOKE ALL ON SCHEMA private FROM public, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM public, anon, authenticated;

-- Helper to fetch a config value (service role only)
CREATE OR REPLACE FUNCTION private.cron_get(_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = private
AS $$
  SELECT value FROM private.cron_config WHERE key = _key;
$$;

REVOKE ALL ON FUNCTION private.cron_get(text) FROM public, anon, authenticated;