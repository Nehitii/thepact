
-- 1) Remove direct user INSERT on user_cosmetics (economy bypass fix)
DROP POLICY IF EXISTS "Users can insert their own cosmetics" ON public.user_cosmetics;

-- Allow service_role / SECURITY DEFINER paths only. Add an admin INSERT for safety.
CREATE POLICY "Admins can insert cosmetics"
ON public.user_cosmetics FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) RPC: claim notification reward (cosmetic / bonds) atomically
CREATE OR REPLACE FUNCTION public.claim_notification_reward(p_notification_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_notif record;
  v_already boolean;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_notif
  FROM public.notifications
  WHERE id = p_notification_id AND user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Notification not found');
  END IF;

  IF v_notif.reward_claimed = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed');
  END IF;

  -- Bond reward
  IF v_notif.reward_amount IS NOT NULL AND v_notif.reward_amount > 0 THEN
    UPDATE public.bond_balance
       SET balance = balance + v_notif.reward_amount,
           total_earned = total_earned + v_notif.reward_amount,
           updated_at = now()
     WHERE user_id = v_user;

    INSERT INTO public.bond_transactions(user_id, amount, transaction_type, description, reference_id, reference_type)
    VALUES (v_user, v_notif.reward_amount, 'earn', 'Claimed reward: ' || COALESCE(v_notif.title,''), v_notif.id, 'notification');
  END IF;

  -- Cosmetic reward
  IF v_notif.reward_cosmetic_id IS NOT NULL AND v_notif.reward_cosmetic_type IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_cosmetics
      WHERE user_id = v_user AND cosmetic_id = v_notif.reward_cosmetic_id AND cosmetic_type = v_notif.reward_cosmetic_type
    ) INTO v_already;

    IF NOT v_already THEN
      INSERT INTO public.user_cosmetics(user_id, cosmetic_id, cosmetic_type)
      VALUES (v_user, v_notif.reward_cosmetic_id, v_notif.reward_cosmetic_type);
    END IF;
  END IF;

  UPDATE public.notifications SET reward_claimed = true WHERE id = p_notification_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_reward(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_notification_reward(uuid) TO authenticated;

-- 3) Admin RPCs to grant/reset cosmetics
CREATE OR REPLACE FUNCTION public.admin_grant_cosmetic(p_user_id uuid, p_cosmetic_id uuid, p_cosmetic_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin only');
  END IF;
  IF p_cosmetic_type NOT IN ('frame','banner','title') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid type');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_cosmetics WHERE user_id = p_user_id AND cosmetic_id = p_cosmetic_id AND cosmetic_type = p_cosmetic_type) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already owned');
  END IF;
  INSERT INTO public.user_cosmetics(user_id, cosmetic_id, cosmetic_type) VALUES (p_user_id, p_cosmetic_id, p_cosmetic_type);
  INSERT INTO public.bond_transactions(user_id, amount, transaction_type, description, reference_id, reference_type)
  VALUES (p_user_id, 0, 'admin_grant', '[ADMIN] Granted ' || p_cosmetic_type, p_cosmetic_id, 'cosmetic');
  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_cosmetic(uuid, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_cosmetic(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reset_cosmetic(p_user_id uuid, p_cosmetic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin only');
  END IF;
  DELETE FROM public.user_cosmetics WHERE user_id = p_user_id AND cosmetic_id = p_cosmetic_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reset_cosmetic(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_cosmetic(uuid, uuid) TO authenticated;

-- 4) Goal templates SELECT restriction
DROP POLICY IF EXISTS "Anyone can view templates" ON public.goal_templates;
CREATE POLICY "View featured or own templates"
ON public.goal_templates FOR SELECT
TO authenticated
USING (
  COALESCE(is_featured, false) = true
  OR created_by IS NULL
  OR created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 5) Guild invite codes: restrict listing to guild members
DROP POLICY IF EXISTS "Anyone can read active invite codes" ON public.guild_invite_codes;
CREATE POLICY "Guild members can read invite codes"
ON public.guild_invite_codes FOR SELECT
TO authenticated
USING (
  is_active = true AND public.is_guild_member(auth.uid(), guild_id)
);
