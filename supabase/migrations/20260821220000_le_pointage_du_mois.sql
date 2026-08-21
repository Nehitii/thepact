-- LE POINTAGE DU MOIS
--
-- La validation ne retenait que des totaux : deux booleens et deux
-- sommes. On declarait donc « les depenses sont conformes » en bloc,
-- sans jamais dire lesquelles etaient parties ni laquelle avait coute
-- autre chose que prevu.
--
-- Une ligne par prelevement pointe. Ce qui rend la chose utile n est
-- pas la case cochee, c est montant_reel : l essence prevue a 150 qui
-- part a 120 se corrige POUR CE MOIS-LA sans toucher a la recurrence,
-- et l historique cesse de mentir d un mois sur l autre.
--
-- On garde ligne_id, mais aussi une copie du nom et du montant prevu :
-- une ligne recurrente peut etre renommee, changee de montant ou
-- supprimee, et le pointage d aout ne doit pas se mettre a raconter
-- l aout d une autre annee.

create table if not exists public.pointages_du_mois (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Le premier du mois pointe.
  mois date not null,

  -- La ligne recurrente concernee. Nulle si elle a ete supprimee
  -- depuis : le pointage garde alors sa valeur d archive.
  ligne_id uuid,
  genre text not null check (genre in ('expense', 'income')),

  -- Copies au moment du pointage. Voir plus haut.
  nom text not null,
  montant_prevu numeric not null default 0,

  -- Ce qui est reellement parti ou rentre.
  montant_reel numeric not null default 0,
  pointe boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- UN SEUL POINTAGE PAR LIGNE ET PAR MOIS.
--
-- L index n est PAS partiel, et c est important. Une premiere version
-- portait « where ligne_id is not null », pour dire que les pointages
-- archives ne se dedoublonnent pas entre eux. L intention etait juste,
-- la mise en oeuvre non : Postgres refuse d inferer une contrainte
-- partielle depuis un ON CONFLICT (colonnes), et PostgREST ne sait pas
-- transmettre le predicat — chaque pointage repondait 42P10 et cocher
-- une case ne faisait rien.
--
-- L index complet obtient le meme resultat : les NULL sont distincts
-- dans un index unique, donc plusieurs archives cohabitent toujours.
create unique index if not exists pointages_une_ligne_par_mois
  on public.pointages_du_mois (user_id, mois, ligne_id);

create index if not exists pointages_par_mois
  on public.pointages_du_mois (user_id, mois);

alter table public.pointages_du_mois enable row level security;

drop policy if exists "pointages : chacun les siens" on public.pointages_du_mois;
create policy "pointages : chacun les siens"
  on public.pointages_du_mois
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
