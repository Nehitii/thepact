-- ═══════════════════════════════════════════════════════════════
-- DES LISTES QUI CONTIENNENT, ET PAS PLUS DE TROIS
--
-- La wishlist ne se groupait que par objectif : ce qui n'en avait pas
-- tombait dans « Sans objectif », soixante-trois postes dans un seul
-- tas. On peut désormais créer ses propres listes.
--
-- LE GARDE-FOU VIT DANS LA BASE, PAS DANS L'INTERFACE. Une limite tenue
-- par un bouton grisé n'est pas une limite : elle tombe dès qu'on ouvre
-- un second onglet, et elle ne protège pas des écritures qui ne passent
-- pas par l'écran. Le déclencheur compte AVANT d'insérer.
--
-- UN POSTE APPARTIENT À UNE LISTE OU À UN OBJECTIF, JAMAIS AUX DEUX.
-- Un poste rattaché à un objectif est financé par le pacte ; le ranger
-- en plus dans une liste personnelle ferait compter la même dépense
-- deux fois dans deux totaux différents. La contrainte le dit.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.wishlist_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wishlist_lists_user_idx
  on public.wishlist_lists (user_id, sort_order, created_at);

-- Deux listes du même nom chez la même personne ne servent qu'à s'y perdre.
create unique index if not exists wishlist_lists_nom_unique
  on public.wishlist_lists (user_id, lower(btrim(name)));

alter table public.wishlist_lists enable row level security;

create policy "Users can view their own wishlist lists"
  on public.wishlist_lists for select using (auth.uid() = user_id);
create policy "Users can create their own wishlist lists"
  on public.wishlist_lists for insert with check (auth.uid() = user_id);
create policy "Users can update their own wishlist lists"
  on public.wishlist_lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own wishlist lists"
  on public.wishlist_lists for delete using (auth.uid() = user_id);

-- La même exigence de second facteur que les autres tables du domaine.
create policy "mfa_aal2_requis"
  on public.wishlist_lists for all
  using ((not a_un_second_facteur()) or ((select auth.jwt() ->> 'aal') = 'aal2'));

-- ── LE GARDE-FOU ──
create or replace function public.garde_trois_listes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deja integer;
begin
  select count(*) into deja from public.wishlist_lists where user_id = new.user_id;
  if deja >= 3 then
    raise exception 'Trois listes au plus.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Une fonction de declencheur n a aucune raison d etre appelable en RPC.
-- SECURITY DEFINER la rendait executable par « anon » et « authenticated »
-- via /rest/v1/rpc — sans effet utile, mais exposee.
revoke execute on function public.garde_trois_listes() from anon, authenticated, public;

drop trigger if exists trois_listes_au_plus on public.wishlist_lists;
create trigger trois_listes_au_plus
  before insert on public.wishlist_lists
  for each row execute function public.garde_trois_listes();

-- ── LE RATTACHEMENT ──
alter table public.wishlist_items
  add column if not exists list_id uuid references public.wishlist_lists(id) on delete set null;

create index if not exists wishlist_items_list_idx on public.wishlist_items (list_id);

-- Un poste tient à un objectif OU à une liste, jamais aux deux.
alter table public.wishlist_items
  drop constraint if exists wishlist_items_une_seule_appartenance;
alter table public.wishlist_items
  add constraint wishlist_items_une_seule_appartenance
  check (goal_id is null or list_id is null);

-- Le compteur de mise à jour, comme partout ailleurs.
drop trigger if exists wishlist_lists_maj on public.wishlist_lists;
create trigger wishlist_lists_maj
  before update on public.wishlist_lists
  for each row execute function public.update_updated_at_column();
