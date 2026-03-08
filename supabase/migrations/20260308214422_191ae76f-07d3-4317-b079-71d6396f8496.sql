
-- 1) Atomic bundle purchase function
CREATE OR REPLACE FUNCTION public.purchase_bundle(p_bundle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_bundle record;
  v_balance_record record;
  v_item jsonb;
  v_item_id uuid;
  v_item_type text;
  v_cosmetic_type text;
  v_already_owned boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Get bundle and validate
  SELECT * INTO v_bundle
  FROM shop_bundles
  WHERE id = p_bundle_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bundle not found or inactive');
  END IF;

  -- Check date validity
  IF v_bundle.starts_at IS NOT NULL AND v_bundle.starts_at > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bundle not yet available');
  END IF;
  IF v_bundle.ends_at IS NOT NULL AND v_bundle.ends_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bundle has expired');
  END IF;

  -- Lock and check balance
  SELECT * INTO v_balance_record
  FROM bond_balance
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No balance record found');
  END IF;

  IF v_balance_record.balance < v_bundle.price_bonds THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient bonds');
  END IF;

  -- Deduct balance
  UPDATE bond_balance
  SET balance = balance - v_bundle.price_bonds,
      total_spent = total_spent + v_bundle.price_bonds,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Insert each item from bundle
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_bundle.items::jsonb)
  LOOP
    v_item_id := (v_item->>'item_id')::uuid;
    v_item_type := v_item->>'item_type';

    IF v_item_type = 'module' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_module_purchases WHERE user_id = v_user_id AND module_id = v_item_id
      ) INTO v_already_owned;
      IF NOT v_already_owned THEN
        INSERT INTO user_module_purchases (user_id, module_id) VALUES (v_user_id, v_item_id);
      END IF;
    ELSE
      v_cosmetic_type := replace(v_item_type, 'cosmetic_', '');
      SELECT EXISTS (
        SELECT 1 FROM user_cosmetics WHERE user_id = v_user_id AND cosmetic_id = v_item_id AND cosmetic_type = v_cosmetic_type
      ) INTO v_already_owned;
      IF NOT v_already_owned THEN
        INSERT INTO user_cosmetics (user_id, cosmetic_id, cosmetic_type) VALUES (v_user_id, v_item_id, v_cosmetic_type);
      END IF;
    END IF;
  END LOOP;

  -- Log transaction
  INSERT INTO bond_transactions (user_id, amount, transaction_type, description, reference_id, reference_type)
  VALUES (v_user_id, -v_bundle.price_bonds, 'spend', 'Purchased bundle: ' || v_bundle.name, p_bundle_id, 'bundle');

  RETURN jsonb_build_object(
    'success', true,
    'price', v_bundle.price_bonds,
    'new_balance', v_balance_record.balance - v_bundle.price_bonds
  );
END;
$$;

-- 2) Atomic daily deal purchase function
CREATE OR REPLACE FUNCTION public.purchase_daily_deal(p_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_deal record;
  v_actual_price integer;
  v_discounted_price integer;
  v_balance_record record;
  v_already_owned boolean := false;
  v_cosmetic_type text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Get deal and validate
  SELECT * INTO v_deal
  FROM shop_daily_deals
  WHERE id = p_deal_id AND is_active = true AND deal_date = CURRENT_DATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not found or expired');
  END IF;

  -- Get actual item price
  IF v_deal.item_type = 'module' THEN
    SELECT price_bonds INTO v_actual_price FROM shop_modules WHERE id = v_deal.item_id AND is_active = true;
  ELSIF v_deal.item_type = 'cosmetic_frame' THEN
    SELECT price INTO v_actual_price FROM cosmetic_frames WHERE id = v_deal.item_id AND is_active = true;
  ELSIF v_deal.item_type = 'cosmetic_banner' THEN
    SELECT price INTO v_actual_price FROM cosmetic_banners WHERE id = v_deal.item_id AND is_active = true;
  ELSIF v_deal.item_type = 'cosmetic_title' THEN
    SELECT price INTO v_actual_price FROM cosmetic_titles WHERE id = v_deal.item_id AND is_active = true;
  END IF;

  IF v_actual_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or inactive');
  END IF;

  v_discounted_price := floor(v_actual_price * (1.0 - v_deal.discount_percentage / 100.0));

  -- Check ownership
  IF v_deal.item_type = 'module' THEN
    SELECT EXISTS (SELECT 1 FROM user_module_purchases WHERE user_id = v_user_id AND module_id = v_deal.item_id) INTO v_already_owned;
  ELSE
    v_cosmetic_type := replace(v_deal.item_type, 'cosmetic_', '');
    SELECT EXISTS (SELECT 1 FROM user_cosmetics WHERE user_id = v_user_id AND cosmetic_id = v_deal.item_id AND cosmetic_type = v_cosmetic_type) INTO v_already_owned;
  END IF;

  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already owned');
  END IF;

  -- Lock and check balance
  SELECT * INTO v_balance_record FROM bond_balance WHERE user_id = v_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No balance record found');
  END IF;

  IF v_balance_record.balance < v_discounted_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient bonds');
  END IF;

  -- Deduct balance
  UPDATE bond_balance
  SET balance = balance - v_discounted_price,
      total_spent = total_spent + v_discounted_price,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Add ownership
  IF v_deal.item_type = 'module' THEN
    INSERT INTO user_module_purchases (user_id, module_id) VALUES (v_user_id, v_deal.item_id);
  ELSE
    INSERT INTO user_cosmetics (user_id, cosmetic_id, cosmetic_type) VALUES (v_user_id, v_deal.item_id, v_cosmetic_type);
  END IF;

  -- Log transaction
  INSERT INTO bond_transactions (user_id, amount, transaction_type, description, reference_id, reference_type)
  VALUES (v_user_id, -v_discounted_price, 'spend', 'Daily deal purchase', v_deal.item_id,
    CASE WHEN v_deal.item_type = 'module' THEN 'module' ELSE 'cosmetic' END);

  RETURN jsonb_build_object(
    'success', true,
    'price', v_discounted_price,
    'new_balance', v_balance_record.balance - v_discounted_price
  );
END;
$$;
