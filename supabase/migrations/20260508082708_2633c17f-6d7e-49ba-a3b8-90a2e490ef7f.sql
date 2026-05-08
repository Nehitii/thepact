
-- Helper to bump today's quest progress for a given user/kind
CREATE OR REPLACE FUNCTION public._bump_quest_progress(_user_id uuid, _kind text, _delta int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.daily_quests
     SET progress = LEAST(target, progress + _delta)
   WHERE user_id = _user_id
     AND kind = _kind
     AND date = (now() AT TIME ZONE 'UTC')::date
     AND status = 'active';
END;
$$;

-- Steps: when status moves to validated/completed
CREATE OR REPLACE FUNCTION public._tg_quest_on_step_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid;
BEGIN
  IF NEW.status::text IN ('validated','completed','done')
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT user_id INTO v_uid FROM public.goals WHERE id = NEW.goal_id;
    IF v_uid IS NOT NULL THEN
      PERFORM public._bump_quest_progress(v_uid, 'complete_steps', 1);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quest_step_complete ON public.steps;
CREATE TRIGGER trg_quest_step_complete
AFTER UPDATE ON public.steps
FOR EACH ROW EXECUTE FUNCTION public._tg_quest_on_step_complete();

-- Habit logs
CREATE OR REPLACE FUNCTION public._tg_quest_on_habit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.completed,false) AND (TG_OP='INSERT' OR COALESCE(OLD.completed,false) = false) THEN
    PERFORM public._bump_quest_progress(NEW.user_id, 'log_habit', 1);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quest_habit_log ON public.habit_logs;
CREATE TRIGGER trg_quest_habit_log
AFTER INSERT OR UPDATE ON public.habit_logs
FOR EACH ROW EXECUTE FUNCTION public._tg_quest_on_habit_log();

-- Journal entries
CREATE OR REPLACE FUNCTION public._tg_quest_on_journal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._bump_quest_progress(NEW.user_id, 'journal_entry', 1);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quest_journal_entry ON public.journal_entries;
CREATE TRIGGER trg_quest_journal_entry
AFTER INSERT ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public._tg_quest_on_journal();
