
-- Create bank_transactions table for detailed transaction tracking
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  transaction_type text NOT NULL DEFAULT 'debit',
  category text,
  note text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON public.bank_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.bank_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.bank_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.bank_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Add finance settings columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS finance_default_account_id uuid REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS finance_csv_date_format text DEFAULT 'YYYY-MM-DD',
  ADD COLUMN IF NOT EXISTS finance_csv_delimiter text DEFAULT ',',
  ADD COLUMN IF NOT EXISTS finance_budget_alert_pct integer DEFAULT 80;

-- Create index for fast lookups
CREATE INDEX idx_bank_transactions_user_date ON public.bank_transactions(user_id, transaction_date DESC);
