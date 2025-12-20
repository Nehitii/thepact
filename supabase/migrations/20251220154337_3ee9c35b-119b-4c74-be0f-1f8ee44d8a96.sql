-- Create table for recurring expenses
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for recurring income
CREATE TABLE public.recurring_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for monthly validations (tracks confirmed data each month)
CREATE TABLE public.monthly_finance_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  confirmed_expenses BOOLEAN NOT NULL DEFAULT false,
  confirmed_income BOOLEAN NOT NULL DEFAULT false,
  unplanned_expenses NUMERIC DEFAULT 0,
  unplanned_income NUMERIC DEFAULT 0,
  actual_total_income NUMERIC DEFAULT 0,
  actual_total_expenses NUMERIC DEFAULT 0,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_month UNIQUE (user_id, month)
);

-- Add finance settings to profiles (salary payment day)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS salary_payment_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS project_funding_target NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS project_monthly_allocation NUMERIC DEFAULT 0;

-- Enable RLS on all new tables
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_finance_validations ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_expenses
CREATE POLICY "Users can view their own recurring expenses"
ON public.recurring_expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses"
ON public.recurring_expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses"
ON public.recurring_expenses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses"
ON public.recurring_expenses FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for recurring_income
CREATE POLICY "Users can view their own recurring income"
ON public.recurring_income FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring income"
ON public.recurring_income FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring income"
ON public.recurring_income FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring income"
ON public.recurring_income FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for monthly_finance_validations
CREATE POLICY "Users can view their own monthly validations"
ON public.monthly_finance_validations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly validations"
ON public.monthly_finance_validations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly validations"
ON public.monthly_finance_validations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly validations"
ON public.monthly_finance_validations FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_income_updated_at
BEFORE UPDATE ON public.recurring_income
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_validations_updated_at
BEFORE UPDATE ON public.monthly_finance_validations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();