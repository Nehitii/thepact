-- Annulation de 20260826140000_le_coach_cesse_de_parler_seul.sql
--
-- Rallume les trois réveils désarmés, à l'identique : mêmes horaires,
-- mêmes commandes, même secret. À exécuter si l'on veut retrouver les
-- insights automatiques et l'évaluateur de règles.
--
-- Les Edge Functions n'ont jamais été dépubliées : il n'y a rien d'autre
-- à redéployer.

select cron.schedule(
  'coach-cron-runner-4h',
  '0 */4 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://upfethjdvrgmmfgfvqdo.supabase.co/functions/v1/coach-cron-runner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE(private.cron_get('CRON_SECRET'), '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $cron$
);

select cron.schedule(
  'coach-weekly-digest',
  '0 18 * * 0',
  $cron$
  SELECT net.http_post(
    url := 'https://upfethjdvrgmmfgfvqdo.supabase.co/functions/v1/coach-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE(private.cron_get('CRON_SECRET'), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);

select cron.schedule(
  'automation-evaluator',
  '*/30 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://upfethjdvrgmmfgfvqdo.supabase.co/functions/v1/automation-evaluator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE(private.cron_get('CRON_SECRET'), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
