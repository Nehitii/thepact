-- Add category column to recurring_expenses table
ALTER TABLE public.recurring_expenses
ADD COLUMN category TEXT;

-- Add category column to recurring_income table  
ALTER TABLE public.recurring_income
ADD COLUMN category TEXT;

-- Add index for faster category lookups
CREATE INDEX idx_recurring_expenses_category ON public.recurring_expenses(category);
CREATE INDEX idx_recurring_income_category ON public.recurring_income(category);