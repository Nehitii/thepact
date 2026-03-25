ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS initial_balance numeric DEFAULT 0;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS balance_date date DEFAULT CURRENT_DATE;