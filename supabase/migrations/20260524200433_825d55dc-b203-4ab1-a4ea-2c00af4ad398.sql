CREATE OR REPLACE FUNCTION public._tg_quest_on_step_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid;
BEGIN
  IF NEW.status::text IN ('validated','completed','done')
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- goals has no user_id column; resolve via pacts
    SELECT p.user_id INTO v_uid
    FROM public.goals g
    JOIN public.pacts p ON p.id = g.pact_id
    WHERE g.id = NEW.goal_id;

    IF v_uid IS NOT NULL THEN
      PERFORM public._bump_quest_progress(v_uid, 'complete_steps', 1);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;