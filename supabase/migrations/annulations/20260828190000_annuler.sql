-- ANNULER : remettre `net_worth_snapshots` et `snapshot_net_worth()`.
--
-- La table est restaurée à l'identique — colonnes, contraintes, index,
-- et les quatre politiques dont celle du second facteur.
--
-- LA FONCTION, ELLE, NE PEUT PAS ÊTRE RESTAURÉE UTILISABLE. Elle lisait
-- `user_accounts` et `bank_transactions`, supprimées le 20/08 par la
-- migration `recentrer_finance_sur_le_pacte`. La recréer telle quelle
-- redonnerait une fonction qui lève « relation does not exist » à la
-- première invocation.
--
-- On ne la recrée donc PAS. Si l'on rejoue ce fichier, c'est pour
-- récupérer la table ; le calcul, lui, est à réécrire sur le modèle de
-- données actuel — `recurring_expenses`, `recurring_income`,
-- `pact_spending` — et la définition d'origine se relit dans
-- l'historique git de la migration du 28/08, qui la cite en entier.

begin;

create table if not exists public.net_worth_snapshots (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  snapshot_date date not null,
  total_balance numeric not null default 0,
  account_count integer not null default 0,
  currency text,
  source text not null default 'manual'::text,
  details jsonb,
  created_at timestamp with time zone not null default now(),
  primary key (id),
  unique (user_id, snapshot_date),
  foreign key (user_id) references auth.users(id) on delete cascade,
  check (source = any (array['manual'::text, 'cron'::text, 'auto'::text]))
);

create index if not exists idx_nws_user_date
  on public.net_worth_snapshots using btree (user_id, snapshot_date desc);

alter table public.net_worth_snapshots enable row level security;

create policy "nws_select_own" on public.net_worth_snapshots
  for select using ((select auth.uid()) = user_id);
create policy "nws_insert_own" on public.net_worth_snapshots
  for insert with check ((select auth.uid()) = user_id);
create policy "nws_delete_own" on public.net_worth_snapshots
  for delete using ((select auth.uid()) = user_id);

-- Le garde du second facteur, RESTRICTIVE, comme sur les 87 autres.
create policy "mfa_aal2_requis" on public.net_worth_snapshots
  as restrictive for all to authenticated
  using ((not (select a_un_second_facteur())) or ((select auth.jwt() ->> 'aal') = 'aal2'));

commit;
