CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snapshot_date date NOT NULL,
  total_balance numeric(14,2) NOT NULL DEFAULT 0,
  account_count integer NOT NULL DEFAULT 0,
  currency text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','cron','auto')),
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_nws_user_date ON public.net_worth_snapshots(user_id, snapshot_date DESC);

ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nws_select_own" ON public.net_worth_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nws_insert_own" ON public.net_worth_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nws_delete_own" ON public.net_worth_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- Atomic snapshot RPC
CREATE OR REPLACE FUNCTION public.snapshot_net_worth(_date date DEFAULT (now() AT TIME ZONE 'UTC')::date)
RETURNS public.net_worth_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total numeric(14,2) := 0;
  v_count integer := 0;
  v_currency text;
  v_details jsonb;
  v_row public.net_worth_snapshots;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  WITH acc AS (
    SELECT a.id,
           a.name,
           COALESCE(a.initial_balance, a.balance, 0) AS initial,
           COALESCE(a.balance_date, a.created_at::date) AS bdate,
           a.currency
    FROM public.user_accounts a
    WHERE a.user_id = v_uid
  ),
  delta AS (
    SELECT t.account_id,
           SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE -t.amount END) AS d
    FROM public.bank_transactions t
    JOIN acc ON acc.id = t.account_id
    WHERE t.user_id = v_uid
      AND t.transaction_date >= acc.bdate
      AND t.transaction_date <= _date
    GROUP BY t.account_id
  ),
  totals AS (
    SELECT acc.id,
           acc.name,
           acc.currency,
           ROUND((acc.initial + COALESCE(delta.d, 0))::numeric, 2) AS bal
    FROM acc LEFT JOIN delta ON delta.account_id = acc.id
  )
  SELECT COALESCE(SUM(bal), 0),
         COUNT(*),
         (SELECT currency FROM totals LIMIT 1),
         COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'balance', bal, 'currency', currency)), '[]'::jsonb)
  INTO v_total, v_count, v_currency, v_details
  FROM totals;

  INSERT INTO public.net_worth_snapshots(user_id, snapshot_date, total_balance, account_count, currency, source, details)
  VALUES (v_uid, _date, v_total, v_count, v_currency, 'manual', v_details)
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET total_balance = EXCLUDED.total_balance,
                account_count = EXCLUDED.account_count,
                currency = EXCLUDED.currency,
                details = EXCLUDED.details
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_net_worth(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.snapshot_net_worth(date) TO authenticated;