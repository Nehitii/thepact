-- Phase 4: Add deadline column to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS deadline date DEFAULT NULL;

-- Phase 5: Add 'archived' to goal_status enum
ALTER TYPE public.goal_status ADD VALUE IF NOT EXISTS 'archived';
ALTER TYPE public.goal_status ADD VALUE IF NOT EXISTS 'paused';

-- Update the trigger to handle paused/archived statuses
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