
-- =========================
-- 1) Sinking funds
-- =========================
CREATE TABLE IF NOT EXISTS public.sinking_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon_emoji text,
  target_amount numeric(14,2) NOT NULL DEFAULT 0,
  target_date date,
  monthly_contribution numeric(14,2) NOT NULL DEFAULT 0,
  current_balance numeric(14,2) NOT NULL DEFAULT 0,
  account_id uuid REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  auto_contribute boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sinking_funds_user ON public.sinking_funds(user_id, is_active);
ALTER TABLE public.sinking_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sf_select_own" ON public.sinking_funds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sf_insert_own" ON public.sinking_funds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sf_update_own" ON public.sinking_funds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sf_delete_own" ON public.sinking_funds FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER sinking_funds_updated_at BEFORE UPDATE ON public.sinking_funds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contributions log
CREATE TABLE IF NOT EXISTS public.sinking_fund_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fund_id uuid NOT NULL REFERENCES public.sinking_funds(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  note text,
  contribution_date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  source text NOT NULL DEFAULT 'manual', -- 'manual' | 'auto'
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sfc_user_fund_date ON public.sinking_fund_contributions(user_id, fund_id, contribution_date DESC);
ALTER TABLE public.sinking_fund_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sfc_select_own" ON public.sinking_fund_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sfc_insert_own" ON public.sinking_fund_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sfc_delete_own" ON public.sinking_fund_contributions FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 2) Debts
-- =========================
CREATE TABLE IF NOT EXISTS public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  debt_type text NOT NULL DEFAULT 'loan', -- loan|mortgage|credit_card|personal|other
  principal numeric(14,2) NOT NULL DEFAULT 0,
  current_balance numeric(14,2) NOT NULL DEFAULT 0,
  interest_rate numeric(6,3) NOT NULL DEFAULT 0,         -- annual %
  monthly_payment numeric(14,2) NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  account_id uuid REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debts_user ON public.debts(user_id, is_active);
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "debts_select_own" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "debts_insert_own" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debts_update_own" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "debts_delete_own" ON public.debts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER debts_updated_at BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 3) Categorization rules
-- =========================
CREATE TABLE IF NOT EXISTS public.categorization_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern text NOT NULL,
  match_type text NOT NULL DEFAULT 'contains', -- contains|equals|prefix|regex
  category text NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_user ON public.categorization_rules(user_id, is_active, priority);
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_select_own" ON public.categorization_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cr_insert_own" ON public.categorization_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cr_update_own" ON public.categorization_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cr_delete_own" ON public.categorization_rules FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER cr_updated_at BEFORE UPDATE ON public.categorization_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 4) RPC: cashflow projection
-- =========================
CREATE OR REPLACE FUNCTION public.compute_cashflow_projection(_months integer DEFAULT 6)
RETURNS TABLE(
  month_start date,
  income numeric,
  expenses numeric,
  sinking numeric,
  debt_payments numeric,
  net numeric,
  cumulative_realistic numeric,
  cumulative_worst numeric,
  cumulative_best numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_income numeric := 0;
  v_expenses numeric := 0;
  v_sinking numeric := 0;
  v_debt numeric := 0;
  v_starting numeric := 0;
  v_cum_real numeric := 0;
  v_cum_worst numeric := 0;
  v_cum_best numeric := 0;
  i integer;
  v_month date;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _months < 1 OR _months > 36 THEN _months := 6; END IF;

  SELECT COALESCE(SUM(amount),0) INTO v_income FROM public.recurring_income WHERE user_id=v_user AND is_active=true;
  SELECT COALESCE(SUM(amount),0) INTO v_expenses FROM public.recurring_expenses WHERE user_id=v_user AND is_active=true;
  SELECT COALESCE(SUM(monthly_contribution),0) INTO v_sinking FROM public.sinking_funds WHERE user_id=v_user AND is_active=true;
  SELECT COALESCE(SUM(monthly_payment),0) INTO v_debt FROM public.debts WHERE user_id=v_user AND is_active=true;

  -- Starting net worth from latest snapshot
  SELECT COALESCE(total_balance,0) INTO v_starting
  FROM public.net_worth_snapshots
  WHERE user_id = v_user
  ORDER BY snapshot_date DESC LIMIT 1;

  IF v_starting IS NULL THEN
    SELECT COALESCE(SUM(balance),0) INTO v_starting
    FROM public.user_accounts WHERE user_id=v_user AND is_active=true;
  END IF;

  v_cum_real := v_starting;
  v_cum_worst := v_starting;
  v_cum_best := v_starting;

  FOR i IN 1.._months LOOP
    v_month := date_trunc('month', (now() AT TIME ZONE 'UTC')::date)::date + make_interval(months => i-1);
    v_cum_real := v_cum_real + (v_income - v_expenses - v_debt); -- sinking is internal transfer, neutral
    v_cum_worst := v_cum_worst + (v_income * 0.9 - v_expenses * 1.1 - v_debt);
    v_cum_best := v_cum_best + (v_income * 1.05 - v_expenses * 0.95 - v_debt);

    month_start := v_month;
    income := v_income;
    expenses := v_expenses;
    sinking := v_sinking;
    debt_payments := v_debt;
    net := v_income - v_expenses - v_debt;
    cumulative_realistic := round(v_cum_real, 2);
    cumulative_worst := round(v_cum_worst, 2);
    cumulative_best := round(v_cum_best, 2);
    RETURN NEXT;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.compute_cashflow_projection(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.compute_cashflow_projection(integer) TO authenticated;

-- =========================
-- 5) RPC: debt amortization schedule
-- =========================
CREATE OR REPLACE FUNCTION public.compute_debt_schedule(_debt_id uuid)
RETURNS TABLE(
  installment integer,
  due_date date,
  payment numeric,
  interest numeric,
  principal_paid numeric,
  remaining_balance numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_debt public.debts;
  v_balance numeric;
  v_rate numeric; -- monthly rate
  v_payment numeric;
  v_interest numeric;
  v_principal numeric;
  i integer := 0;
  v_max integer := 600;
  v_due date;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_debt FROM public.debts WHERE id = _debt_id AND user_id = v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'Debt not found'; END IF;

  v_balance := COALESCE(v_debt.current_balance, v_debt.principal, 0);
  v_rate := COALESCE(v_debt.interest_rate, 0) / 100.0 / 12.0;
  v_payment := COALESCE(v_debt.monthly_payment, 0);
  v_due := COALESCE(v_debt.start_date, CURRENT_DATE);

  IF v_payment <= 0 OR v_balance <= 0 THEN RETURN; END IF;

  WHILE v_balance > 0 AND i < v_max LOOP
    i := i + 1;
    v_interest := round(v_balance * v_rate, 2);
    v_principal := LEAST(v_payment - v_interest, v_balance);
    IF v_principal <= 0 THEN
      -- Negative amortization safeguard
      RETURN;
    END IF;
    v_balance := round(v_balance - v_principal, 2);
    installment := i;
    due_date := (v_due + make_interval(months => i))::date;
    payment := round(v_principal + v_interest, 2);
    interest := v_interest;
    principal_paid := round(v_principal, 2);
    remaining_balance := GREATEST(v_balance, 0);
    RETURN NEXT;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.compute_debt_schedule(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.compute_debt_schedule(uuid) TO authenticated;

-- =========================
-- 6) RPC: apply sinking contribution
-- =========================
CREATE OR REPLACE FUNCTION public.apply_sinking_contribution(_fund_id uuid, _amount numeric, _note text DEFAULT NULL, _source text DEFAULT 'manual')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_fund public.sinking_funds;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF _amount IS NULL OR _amount = 0 THEN RETURN jsonb_build_object('success', false, 'error', 'Amount required'); END IF;
  SELECT * INTO v_fund FROM public.sinking_funds WHERE id = _fund_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Fund not found'); END IF;

  UPDATE public.sinking_funds
     SET current_balance = current_balance + _amount, updated_at = now()
   WHERE id = _fund_id;

  INSERT INTO public.sinking_fund_contributions(user_id, fund_id, amount, note, source)
  VALUES (v_user, _fund_id, _amount, _note, COALESCE(_source,'manual'));

  RETURN jsonb_build_object('success', true, 'new_balance', v_fund.current_balance + _amount);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_sinking_contribution(uuid, numeric, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.apply_sinking_contribution(uuid, numeric, text, text) TO authenticated;

-- =========================
-- 7) RPC: apply categorization rules to recent uncategorized transactions
-- =========================
CREATE OR REPLACE FUNCTION public.apply_categorization_rules(_limit integer DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_count integer := 0;
  r record;
  t record;
  v_match boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF _limit IS NULL OR _limit <= 0 OR _limit > 5000 THEN _limit := 500; END IF;

  FOR t IN
    SELECT id, description FROM public.bank_transactions
    WHERE user_id = v_user AND (category IS NULL OR category = '')
    ORDER BY transaction_date DESC LIMIT _limit
  LOOP
    FOR r IN
      SELECT pattern, match_type, category FROM public.categorization_rules
      WHERE user_id = v_user AND is_active = true
      ORDER BY priority ASC, created_at ASC
    LOOP
      v_match := false;
      IF r.match_type = 'equals' THEN
        v_match := lower(t.description) = lower(r.pattern);
      ELSIF r.match_type = 'prefix' THEN
        v_match := lower(t.description) LIKE lower(r.pattern) || '%';
      ELSIF r.match_type = 'regex' THEN
        BEGIN
          v_match := t.description ~* r.pattern;
        EXCEPTION WHEN others THEN v_match := false;
        END;
      ELSE -- contains
        v_match := position(lower(r.pattern) in lower(t.description)) > 0;
      END IF;

      IF v_match THEN
        UPDATE public.bank_transactions SET category = r.category WHERE id = t.id;
        v_count := v_count + 1;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', v_count);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_categorization_rules(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.apply_categorization_rules(integer) TO authenticated;
