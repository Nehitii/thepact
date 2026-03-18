
-- 1. Bank Accounts table
CREATE TABLE public.user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  bank_name text,
  account_type text DEFAULT 'checking',
  balance numeric DEFAULT 0,
  icon_emoji text,
  icon_url text,
  color text DEFAULT '#60a5fa',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own accounts"
  ON public.user_accounts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Account Transfers table
CREATE TABLE public.account_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_account_id uuid REFERENCES public.user_accounts(id) ON DELETE CASCADE NOT NULL,
  to_account_id uuid REFERENCES public.user_accounts(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  note text,
  transfer_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transfers"
  ON public.account_transfers FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Add icon columns to recurring tables
ALTER TABLE public.recurring_expenses ADD COLUMN icon_emoji text;
ALTER TABLE public.recurring_expenses ADD COLUMN icon_url text;

ALTER TABLE public.recurring_income ADD COLUMN icon_emoji text;
ALTER TABLE public.recurring_income ADD COLUMN icon_url text;

-- 4. Atomic transfer function
CREATE OR REPLACE FUNCTION public.execute_account_transfer(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_from_balance numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  IF p_from_account_id = p_to_account_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to same account');
  END IF;

  -- Lock source account and verify ownership
  SELECT balance INTO v_from_balance
  FROM user_accounts
  WHERE id = p_from_account_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source account not found');
  END IF;

  -- Verify destination ownership
  IF NOT EXISTS (SELECT 1 FROM user_accounts WHERE id = p_to_account_id AND user_id = v_user_id FOR UPDATE) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Destination account not found');
  END IF;

  -- Debit source
  UPDATE user_accounts SET balance = balance - p_amount, updated_at = now() WHERE id = p_from_account_id;
  -- Credit destination
  UPDATE user_accounts SET balance = balance + p_amount, updated_at = now() WHERE id = p_to_account_id;

  -- Log transfer
  INSERT INTO account_transfers (user_id, from_account_id, to_account_id, amount, note)
  VALUES (v_user_id, p_from_account_id, p_to_account_id, p_amount, p_note);

  RETURN jsonb_build_object('success', true);
END;
$$;
