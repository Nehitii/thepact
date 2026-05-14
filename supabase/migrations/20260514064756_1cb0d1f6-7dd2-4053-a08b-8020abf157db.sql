ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prestige integer NOT NULL DEFAULT 0;

ALTER TABLE public.cosmetic_frames
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS available_until timestamptz;
ALTER TABLE public.cosmetic_banners
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS available_until timestamptz;
ALTER TABLE public.cosmetic_titles
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS available_until timestamptz;

CREATE TABLE IF NOT EXISTS public.season_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  cosmetic_type text NOT NULL CHECK (cosmetic_type IN ('frame','banner','title')),
  cosmetic_id uuid NOT NULL,
  unlock_rank integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, unlock_rank, cosmetic_type)
);
ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "season_rewards_read_all" ON public.season_rewards FOR SELECT USING (true);
CREATE POLICY "season_rewards_admin_manage" ON public.season_rewards FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.hall_of_fame (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rank integer NOT NULL,
  display_name text,
  avatar_url text,
  points integer NOT NULL DEFAULT 0,
  goals_completed integer NOT NULL DEFAULT 0,
  prestige_awarded integer NOT NULL DEFAULT 0,
  snapshot_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, user_id)
);
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hall_of_fame_read_all" ON public.hall_of_fame FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_hof_season_rank ON public.hall_of_fame(season_id, rank);

CREATE OR REPLACE FUNCTION public.current_season()
RETURNS public.seasons
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.seasons
  WHERE now() >= starts_at AND now() < ends_at
  ORDER BY starts_at DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.snapshot_season_leaderboard(_season_id uuid, _top integer DEFAULT 100)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_row record;
  v_rank integer := 0;
  v_prestige integer;
BEGIN
  IF _season_id IS NULL THEN
    RAISE EXCEPTION 'season_id required';
  END IF;

  DELETE FROM public.hall_of_fame WHERE season_id = _season_id;

  FOR v_row IN
    SELECT
      p.id AS user_id,
      p.display_name,
      p.avatar_url,
      COALESCE(pa.points, 0) AS points,
      COALESCE(at.goals_completed_total, 0) AS goals_completed
    FROM public.profiles p
    LEFT JOIN public.pacts pa ON pa.user_id = p.id
    LEFT JOIN public.achievement_tracking at ON at.user_id = p.id
    WHERE p.community_profile_discoverable = true
    ORDER BY COALESCE(pa.points, 0) DESC, COALESCE(at.goals_completed_total, 0) DESC
    LIMIT _top
  LOOP
    v_rank := v_rank + 1;
    v_prestige := CASE
      WHEN v_rank = 1 THEN 3
      WHEN v_rank <= 3 THEN 2
      WHEN v_rank <= 10 THEN 1
      ELSE 0
    END;

    INSERT INTO public.hall_of_fame
      (season_id, user_id, rank, display_name, avatar_url, points, goals_completed, prestige_awarded)
    VALUES
      (_season_id, v_row.user_id, v_rank, v_row.display_name, v_row.avatar_url,
       v_row.points, v_row.goals_completed, v_prestige);

    IF v_prestige > 0 THEN
      UPDATE public.profiles
        SET prestige = COALESCE(prestige, 0) + v_prestige,
            updated_at = now()
      WHERE id = v_row.user_id;
    END IF;

    INSERT INTO public.user_cosmetics (user_id, cosmetic_type, cosmetic_id)
    SELECT v_row.user_id, sr.cosmetic_type, sr.cosmetic_id
    FROM public.season_rewards sr
    WHERE sr.season_id = _season_id
      AND sr.unlock_rank >= v_rank
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  UPDATE public.seasons
    SET leaderboard_snapshot = (
      SELECT jsonb_agg(jsonb_build_object(
        'rank', rank, 'user_id', user_id, 'display_name', display_name,
        'points', points, 'prestige', prestige_awarded
      ) ORDER BY rank)
      FROM public.hall_of_fame WHERE season_id = _season_id
    )
  WHERE id = _season_id;

  RETURN v_count;
END;
$$;