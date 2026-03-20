
-- Storage bucket for finance icons (accounts, recurring items)
INSERT INTO storage.buckets (id, name, public) VALUES ('finance-icons', 'finance-icons', true);

CREATE POLICY "Users can upload finance icons"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'finance-icons' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view finance icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'finance-icons');

CREATE POLICY "Users can update their finance icons"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'finance-icons' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their finance icons"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'finance-icons' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Category budget limits
CREATE TABLE public.category_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  budget_type text NOT NULL DEFAULT 'expense',
  monthly_limit numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, budget_type)
);

ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own category budgets"
  ON public.category_budgets FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Savings goals
CREATE TABLE public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  linked_account_id uuid REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  icon_emoji text DEFAULT '🎯',
  color text DEFAULT '#60a5fa',
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own savings goals"
  ON public.savings_goals FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
