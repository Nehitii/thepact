-- Drop the public SELECT policy that exposes promo codes
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;

-- Create admin-only SELECT policy for promo codes
CREATE POLICY "Admins can view all promo codes"
ON public.promo_codes FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure server-side redemption function with atomic operations
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record promo_codes%ROWTYPE;
  v_user_id uuid;
  v_existing_redemption uuid;
  v_existing_balance record;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Lock and validate code atomically
  SELECT * INTO v_code_record
  FROM promo_codes
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  END IF;
  
  -- Check existing redemption
  SELECT id INTO v_existing_redemption
  FROM promo_code_redemptions
  WHERE user_id = v_user_id AND promo_code_id = v_code_record.id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already redeemed');
  END IF;
  
  -- Insert redemption record
  INSERT INTO promo_code_redemptions (user_id, promo_code_id)
  VALUES (v_user_id, v_code_record.id);
  
  -- Increment counter atomically
  UPDATE promo_codes
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = v_code_record.id;
  
  -- Handle bond rewards within the same transaction
  IF v_code_record.reward_type = 'bonds' THEN
    -- Check existing balance
    SELECT * INTO v_existing_balance
    FROM bond_balance
    WHERE user_id = v_user_id;
    
    IF FOUND THEN
      -- Update existing balance
      UPDATE bond_balance
      SET balance = balance + v_code_record.reward_amount,
          total_earned = total_earned + v_code_record.reward_amount,
          updated_at = now()
      WHERE user_id = v_user_id;
    ELSE
      -- Create new balance
      INSERT INTO bond_balance (user_id, balance, total_earned)
      VALUES (v_user_id, v_code_record.reward_amount, v_code_record.reward_amount);
    END IF;
    
    -- Create transaction record
    INSERT INTO bond_transactions (user_id, amount, transaction_type, description, reference_id, reference_type)
    VALUES (v_user_id, v_code_record.reward_amount, 'promo_code', 'Promo code: ' || v_code_record.code, v_code_record.id, 'promo_code');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'reward_type', v_code_record.reward_type,
    'reward_amount', v_code_record.reward_amount,
    'code', v_code_record.code
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;