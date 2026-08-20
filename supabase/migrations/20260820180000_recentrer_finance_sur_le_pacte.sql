-- L onglet finance redevient ce qu il devait etre : un visualiseur du
-- pacte. Tout ce qui relevait de la tenue de comptes bancaires en sort.
--
-- Etat au moment de la suppression : seule « user_accounts » portait des
-- lignes (trois). Les huit autres tables etaient vides. Une sauvegarde de
-- ces trois comptes a ete remise avant l operation.

-- Les fonctions d abord : elles referencent les tables.
drop function if exists public.apply_categorization_rules(integer);
drop function if exists public.apply_sinking_contribution(uuid, numeric, text, text);
drop function if exists public.compute_cashflow_projection(integer);
drop function if exists public.compute_debt_schedule(uuid);
drop function if exists public.execute_account_transfer(uuid, uuid, numeric, text);

-- Le reglage qui pointait vers un compte disparait avec eux.
alter table public.profiles
  drop column if exists finance_default_account_id,
  drop column if exists finance_csv_date_format,
  drop column if exists finance_csv_delimiter,
  drop column if exists finance_budget_alert_pct;

-- Les tables. « cascade » emporte les politiques, index et declencheurs.
drop table if exists public.sinking_fund_contributions cascade;
drop table if exists public.sinking_funds cascade;
drop table if exists public.account_transfers cascade;
drop table if exists public.bank_transactions cascade;
drop table if exists public.categorization_rules cascade;
drop table if exists public.category_budgets cascade;
drop table if exists public.savings_goals cascade;
drop table if exists public.debts cascade;
drop table if exists public.user_accounts cascade;

-- Une piece a acheter peut desormais etre marquee comme acquise : c est
-- ce qui alimente le « deja finance » du tableau de bord, article par
-- article, au lieu d attendre qu un goal entier soit termine.
alter table public.goal_cost_items
  add column if not exists acquired_at timestamptz;

comment on column public.goal_cost_items.acquired_at is
  'Date d acquisition de la piece. Nul tant qu elle n est pas achetee.';

create index if not exists goal_cost_items_acquired_idx
  on public.goal_cost_items (goal_id) where acquired_at is not null;
