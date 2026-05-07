
CREATE OR REPLACE FUNCTION public.settle_contract(_contract_id uuid, _outcome text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract public.goal_contracts;
  v_uid uuid := auth.uid();
  v_witness uuid;
  v_share int;
  v_count int;
  v_remainder int;
  v_idx int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Auth required';
  END IF;
  IF _outcome NOT IN ('succeeded','failed') THEN
    RAISE EXCEPTION 'Invalid outcome';
  END IF;

  SELECT * INTO v_contract FROM public.goal_contracts WHERE id = _contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.owner_id <> v_uid THEN RAISE EXCEPTION 'Not owner'; END IF;
  IF v_contract.status NOT IN ('active','pending') THEN
    RAISE EXCEPTION 'Contract already settled';
  END IF;

  IF _outcome = 'succeeded' THEN
    -- Refund stake to owner
    INSERT INTO public.bond_balance (user_id, balance, total_earned)
    VALUES (v_uid, v_contract.stake_bonds, v_contract.stake_bonds)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = public.bond_balance.balance + v_contract.stake_bonds,
        total_earned = public.bond_balance.total_earned + v_contract.stake_bonds,
        updated_at = now();
  ELSE
    -- Distribute to witnesses
    v_count := COALESCE(array_length(v_contract.witnesses, 1), 0);
    IF v_count > 0 THEN
      v_share := v_contract.stake_bonds / v_count;
      v_remainder := v_contract.stake_bonds - (v_share * v_count);
      FOREACH v_witness IN ARRAY v_contract.witnesses LOOP
        v_idx := v_idx + 1;
        DECLARE v_amt int := v_share + CASE WHEN v_idx = 1 THEN v_remainder ELSE 0 END;
        BEGIN
          INSERT INTO public.bond_balance (user_id, balance, total_earned)
          VALUES (v_witness, v_amt, v_amt)
          ON CONFLICT (user_id) DO UPDATE
          SET balance = public.bond_balance.balance + v_amt,
              total_earned = public.bond_balance.total_earned + v_amt,
              updated_at = now();
        END;
      END LOOP;
    END IF;
  END IF;

  UPDATE public.goal_contracts
  SET status = _outcome, settled_at = now(), updated_at = now()
  WHERE id = _contract_id;

  RETURN jsonb_build_object('ok', true, 'outcome', _outcome, 'stake', v_contract.stake_bonds);
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_contract(uuid, text) TO authenticated;
