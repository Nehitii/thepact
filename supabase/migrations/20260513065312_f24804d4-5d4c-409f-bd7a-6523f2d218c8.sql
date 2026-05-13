
-- Contract signatures
CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.goal_contracts(id) ON DELETE CASCADE,
  witness_id UUID NOT NULL,
  signature_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_id, witness_id)
);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract ON public.contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_witness ON public.contract_signatures(witness_id);

ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_read_witness_or_owner" ON public.contract_signatures FOR SELECT
  USING (
    auth.uid() = witness_id
    OR EXISTS (
      SELECT 1 FROM public.goal_contracts gc
      WHERE gc.id = contract_id
        AND (gc.owner_id = auth.uid() OR auth.uid() = ANY(gc.witnesses))
    )
  );

-- No direct insert/update — signatures go through SECURITY DEFINER RPC.
CREATE POLICY "cs_no_direct_insert" ON public.contract_signatures FOR INSERT
  WITH CHECK (false);
CREATE POLICY "cs_no_direct_update" ON public.contract_signatures FOR UPDATE
  USING (false);

-- Allow contract owner to delete (e.g. cleanup) — optional
CREATE POLICY "cs_owner_delete" ON public.contract_signatures FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.goal_contracts gc
      WHERE gc.id = contract_id AND gc.owner_id = auth.uid()
    )
  );

-- ============= Sign RPC =============
CREATE OR REPLACE FUNCTION public.sign_goal_contract(
  _contract_id UUID,
  _signature_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_contract public.goal_contracts;
  v_count INT;
  v_required INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF _signature_name IS NULL OR length(trim(_signature_name)) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Signature name too short');
  END IF;

  SELECT * INTO v_contract FROM public.goal_contracts WHERE id = _contract_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
  END IF;

  IF NOT (v_user = ANY(v_contract.witnesses)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a witness on this contract');
  END IF;

  IF v_contract.status NOT IN ('pending', 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contract is not signable');
  END IF;

  INSERT INTO public.contract_signatures (contract_id, witness_id, signature_name)
  VALUES (_contract_id, v_user, trim(_signature_name))
  ON CONFLICT (contract_id, witness_id) DO NOTHING;

  SELECT COUNT(*) INTO v_count FROM public.contract_signatures WHERE contract_id = _contract_id;
  v_required := COALESCE(array_length(v_contract.witnesses, 1), 0);

  IF v_count >= v_required AND v_contract.status = 'pending' THEN
    UPDATE public.goal_contracts
    SET status = 'active',
        signed_at = now()
    WHERE id = _contract_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'signed', v_count,
    'required', v_required,
    'activated', v_count >= v_required
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sign_goal_contract(UUID, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sign_goal_contract(UUID, TEXT) TO authenticated;

-- ============= Notification cascade trigger =============
CREATE OR REPLACE FUNCTION public.notify_goal_contract_witnesses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_witness UUID;
  v_owner_name TEXT;
  v_goal_name TEXT;
BEGIN
  -- Only on initial insert in pending status
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, 'Un ami') INTO v_owner_name
  FROM public.profiles WHERE id = NEW.owner_id;

  SELECT name INTO v_goal_name FROM public.goals WHERE id = NEW.goal_id;

  IF NEW.witnesses IS NOT NULL THEN
    FOREACH v_witness IN ARRAY NEW.witnesses LOOP
      INSERT INTO public.notifications (
        user_id, title, description, priority, icon_key, cta_url, cta_label
      ) VALUES (
        v_witness,
        'Demande de témoignage',
        format('%s te demande d''être témoin du pacte « %s » (%s Bonds en jeu).',
               v_owner_name, COALESCE(v_goal_name, 'objectif'), NEW.stake_bonds),
        'social',
        'star',
        '/contracts/sign/' || NEW.id::text,
        'Signer le pacte'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_goal_contracts_notify_witnesses ON public.goal_contracts;
CREATE TRIGGER trg_goal_contracts_notify_witnesses
  AFTER INSERT ON public.goal_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_goal_contract_witnesses();
