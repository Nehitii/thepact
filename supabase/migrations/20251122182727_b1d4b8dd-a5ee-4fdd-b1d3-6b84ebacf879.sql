-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create goal_type enum
CREATE TYPE public.goal_type AS ENUM ('personal', 'professional', 'health', 'creative', 'financial', 'learning', 'other');

-- Create goal_difficulty enum
CREATE TYPE public.goal_difficulty AS ENUM ('easy', 'medium', 'hard', 'extreme');

-- Create goal_status enum
CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- Create step_status enum
CREATE TYPE public.step_status AS ENUM ('pending', 'completed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Pact table (one per user)
CREATE TABLE public.pacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  mantra TEXT NOT NULL,
  symbol TEXT DEFAULT 'flame',
  color TEXT DEFAULT 'amber',
  points INTEGER DEFAULT 0,
  tier INTEGER DEFAULT 1,
  global_progress DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pact_id UUID REFERENCES public.pacts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type goal_type DEFAULT 'other',
  difficulty goal_difficulty DEFAULT 'medium',
  status goal_status DEFAULT 'active',
  total_steps INTEGER DEFAULT 0,
  validated_steps INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  potential_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Steps table
CREATE TABLE public.steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  status step_status DEFAULT 'pending',
  due_date DATE,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health table
CREATE TABLE public.health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  weight DECIMAL(5,2),
  sleep DECIMAL(4,2),
  activity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Finance table
CREATE TABLE public.finance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  income DECIMAL(10,2) DEFAULT 0,
  fixed_expenses DECIMAL(10,2) DEFAULT 0,
  variable_expenses DECIMAL(10,2) DEFAULT 0,
  savings DECIMAL(10,2) DEFAULT 0,
  remaining_budget DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, month)
);

-- Pact spending table
CREATE TABLE public.pact_spending (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pact_spending ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Pacts policies
CREATE POLICY "Users can view their own pact"
  ON public.pacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pact"
  ON public.pacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pact"
  ON public.pacts FOR UPDATE
  USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view their own goals"
  ON public.goals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pacts
    WHERE pacts.id = goals.pact_id
    AND pacts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own goals"
  ON public.goals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pacts
    WHERE pacts.id = pact_id
    AND pacts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own goals"
  ON public.goals FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.pacts
    WHERE pacts.id = goals.pact_id
    AND pacts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own goals"
  ON public.goals FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.pacts
    WHERE pacts.id = goals.pact_id
    AND pacts.user_id = auth.uid()
  ));

-- Steps policies
CREATE POLICY "Users can view their own steps"
  ON public.steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.goals
    JOIN public.pacts ON pacts.id = goals.pact_id
    WHERE goals.id = steps.goal_id
    AND pacts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own steps"
  ON public.steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.goals
    JOIN public.pacts ON pacts.id = goals.pact_id
    WHERE goals.id = goal_id
    AND pacts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own steps"
  ON public.steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.goals
    JOIN public.pacts ON pacts.id = goals.pact_id
    WHERE goals.id = steps.goal_id
    AND pacts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own steps"
  ON public.steps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.goals
    JOIN public.pacts ON pacts.id = goals.pact_id
    WHERE goals.id = steps.goal_id
    AND pacts.user_id = auth.uid()
  ));

-- Health policies
CREATE POLICY "Users can view their own health data"
  ON public.health FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health data"
  ON public.health FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health data"
  ON public.health FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health data"
  ON public.health FOR DELETE
  USING (auth.uid() = user_id);

-- Finance policies
CREATE POLICY "Users can view their own finance data"
  ON public.finance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own finance data"
  ON public.finance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own finance data"
  ON public.finance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own finance data"
  ON public.finance FOR DELETE
  USING (auth.uid() = user_id);

-- Pact spending policies
CREATE POLICY "Users can view their own pact spending"
  ON public.pact_spending FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pact spending"
  ON public.pact_spending FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pact spending"
  ON public.pact_spending FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pact spending"
  ON public.pact_spending FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacts_updated_at
  BEFORE UPDATE ON public.pacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_steps_updated_at
  BEFORE UPDATE ON public.steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_updated_at
  BEFORE UPDATE ON public.health
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_updated_at
  BEFORE UPDATE ON public.finance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();