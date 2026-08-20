-- UN GROUPE NE S HONORE PAS TOUT SEUL.
--
-- Le declencheur derive le statut d un objectif de ses compteurs :
-- zero valide, il est non engage ; tout valide, il est honore. Depuis
-- que les compteurs d un groupe suivent ses membres, cette derniere
-- branche honorait un groupe des que son dernier membre l etait, et
-- lui versait son experience sans que personne l ait decide.
--
-- Un groupe se declare honore a la main. Le declencheur ne le mene
-- donc plus qu entre « non engage » et « en cours » ; la derniere
-- marche se franchit par un geste explicite.
--
-- Deux precautions. Un groupe honore dans le meme UPDATE — le geste
-- explicite — passe sans etre corrige. Et un groupe deja honore le
-- reste quand ses membres bougent ensuite : sans cela, defaire une
-- etape chez un membre annulerait la declaration, exactement comme le
-- declencheur respecte deja une mise en pause ou un archivage.
--
-- Les objectifs ordinaires et les habitudes ne changent pas de
-- comportement.

CREATE OR REPLACE FUNCTION public.update_goal_status_on_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Don't auto-update if goal is paused or archived (user explicitly set these)
  IF OLD.status IN ('paused', 'archived') AND
     NEW.validated_steps IS NOT DISTINCT FROM OLD.validated_steps AND
     NEW.total_steps IS NOT DISTINCT FROM OLD.total_steps THEN
    RETURN NEW;
  END IF;

  -- If status was explicitly changed to paused or archived, respect it
  IF NEW.status IN ('paused', 'archived') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Un groupe s honore a la main : le declencheur ne le mene qu au
  -- seuil, et respecte la declaration une fois faite.
  IF NEW.goal_type = 'super' THEN
    IF NEW.status = 'fully_completed' AND OLD.status IS DISTINCT FROM NEW.status THEN
      RETURN NEW;
    END IF;
    IF OLD.status = 'fully_completed' THEN
      RETURN NEW;
    END IF;
    IF NEW.validated_steps = 0 AND NEW.total_steps > 0 THEN
      NEW.status = 'not_started';
    ELSIF NEW.validated_steps > 0 AND NEW.total_steps > 0 THEN
      NEW.status = 'in_progress';
    END IF;
    RETURN NEW;
  END IF;

  -- Auto-update status based on validated steps
  IF NEW.validated_steps = 0 AND NEW.total_steps > 0 THEN
    NEW.status = 'not_started';
  ELSIF NEW.validated_steps > 0 AND NEW.validated_steps < NEW.total_steps THEN
    NEW.status = 'in_progress';
  ELSIF NEW.validated_steps >= NEW.total_steps AND NEW.total_steps > 0 THEN
    NEW.status = 'fully_completed';
    IF NEW.completion_date IS NULL THEN
      NEW.completion_date = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
