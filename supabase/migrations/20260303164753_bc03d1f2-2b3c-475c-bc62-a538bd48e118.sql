-- Atomic purchase function for cosmetics and modules
-- Prevents race conditions and client-side balance manipulation

CREATE OR REPLACE FUNCTION public.purchase_shop_item(
  p_item_id uuid,
  p_item_type text, -- 'frame', 'banner', 'title', 'module'
  p_price integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_balance_record record;
  v_actual_price integer;
  v_already_owned boolean := false;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Validate item type
  IF p_item_type NOT IN ('frame', 'banner', 'title', 'module') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid item type');
  END IF;

  -- Verify item exists and get actual price (prevent price tampering)
  IF p_item_type = 'module' THEN
    SELECT price_bonds INTO v_actual_price
    FROM shop_modules
    WHERE id = p_item_id AND is_active = true;
  ELSIF p_item_type = 'frame' THEN
    SELECT price INTO v_actual_price
    FROM cosmetic_frames
    WHERE id = p_item_id AND is_active = true;
  ELSIF p_item_type = 'banner' THEN
    SELECT price INTO v_actual_price
    FROM cosmetic_banners
    WHERE id = p_item_id AND is_active = true;
  ELSIF p_item_type = 'title' THEN
    SELECT price INTO v_actual_price
    FROM cosmetic_titles
    WHERE id = p_item_id AND is_active = true;
  END IF;

  IF v_actual_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or inactive');
  END IF;

  -- Check if already owned
  IF p_item_type = 'module' THEN
    SELECT EXISTS (
      SELECT 1 FROM user_module_purchases
      WHERE user_id = v_user_id AND module_id = p_item_id
    ) INTO v_already_owned;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM user_cosmetics
      WHERE user_id = v_user_id AND cosmetic_id = p_item_id AND cosmetic_type = p_item_type
    ) INTO v_already_owned;
  END IF;

  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already owned');
  END IF;

  -- Lock and check balance atomically
  SELECT * INTO v_balance_record
  FROM bond_balance
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No balance record found');
  END IF;

  IF v_balance_record.balance < v_actual_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient bonds');
  END IF;

  -- Deduct balance
  UPDATE bond_balance
  SET balance = balance - v_actual_price,
      total_spent = total_spent + v_actual_price,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Add ownership
  IF p_item_type = 'module' THEN
    INSERT INTO user_module_purchases (user_id, module_id)
    VALUES (v_user_id, p_item_id);
  ELSE
    INSERT INTO user_cosmetics (user_id, cosmetic_id, cosmetic_type)
    VALUES (v_user_id, p_item_id, p_item_type);
  END IF;

  -- Log transaction
  INSERT INTO bond_transactions (user_id, amount, transaction_type, description, reference_id, reference_type)
  VALUES (v_user_id, -v_actual_price, 'spend',
    'Purchased ' || p_item_type,
    p_item_id, CASE WHEN p_item_type = 'module' THEN 'module' ELSE 'cosmetic' END);

  RETURN jsonb_build_object(
    'success', true,
    'price', v_actual_price,
    'new_balance', v_balance_record.balance - v_actual_price
  );
END;
$$;