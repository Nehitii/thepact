-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-23
-- sans qu un fichier soit ecrit dans le depot. Elle n existait plus
-- que dans « supabase_migrations.schema_migrations », qui garde le SQL
-- de chaque migration en plus de son numero.
--
-- Le contenu ci-dessous est celui du registre, mot pour mot — la prose
-- d origine comprise. Rien n a ete reecrit.
--
-- NE PAS LA REJOUER : elle est deja appliquee. Elle est ici pour que
-- « supabase/migrations » redevienne un compte rendu fidele du schema,
-- et pour qu un environnement neuf puisse etre reconstruit.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- UN TROPHEE DE CATEGORIE SE GAGNE — ET SE PAIE
-- ═══════════════════════════════════════════════════════════════
--
-- Franchir une categorie entiere etait le seul geste de la page qui
-- se merite vraiment, et le seul qui ne rapportait rien : l anneau
-- devenait dore, et c etait tout.
--
-- Le trophee est ENREGISTRE, pas deduit. Un succes desactive plus tard
-- ne doit pas effacer un trophee deja gagne : ce qui a ete fait a ete
-- fait, meme si le jeu change ensuite.
--
-- LA RECOMPENSE SUIT LA TAILLE DE LA CATEGORIE — cinquante bonds par
-- succes qu elle contient. Une categorie de quatre en vaut deux cents,
-- une de huit quatre cents. C est lisible sans bareme a expliquer, et
-- ca ne paie pas une seconde fois ce que les succes ont deja paye :
-- c est le FAIT DE TOUT AVOIR qui est recompense, pas chaque piece.

create table if not exists public.trophees_gagnes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categorie text not null,
  succes_dans_la_categorie integer not null,
  bonds integer not null,
  gagne_le timestamptz not null default now(),
  vu boolean not null default false,
  unique (user_id, categorie)
);

alter table public.trophees_gagnes enable row level security;

drop policy if exists "Chacun voit ses trophees" on public.trophees_gagnes;
create policy "Chacun voit ses trophees"
  on public.trophees_gagnes for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Chacun marque ses trophees comme vus" on public.trophees_gagnes;
create policy "Chacun marque ses trophees comme vus"
  on public.trophees_gagnes for update to authenticated
  using (user_id = auth.uid());

comment on table public.trophees_gagnes is
  'Une categorie entierement franchie. Enregistre plutot que deduit : desactiver un succes plus tard ne doit pas effacer un trophee deja gagne.';

-- ═══════════════════════════════════════════════════════════════

create or replace function public.reclamer_les_trophees(p_user_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_neufs integer := 0;
  v_bonds integer := 0;
begin
  with complets as (
    select s.categorie,
           count(*)::int as combien,
           count(*) filter (where s.obtenu)::int as obtenus
      from public.succes_du_membre(p_user_id) s
     group by s.categorie
    having count(*) = count(*) filter (where s.obtenu)
       and count(*) > 0
  ),
  poses as (
    insert into public.trophees_gagnes (user_id, categorie, succes_dans_la_categorie, bonds)
    select p_user_id, c.categorie, c.combien, c.combien * 50
      from complets c
    on conflict (user_id, categorie) do nothing
    returning categorie, bonds
  )
  select count(*)::int, coalesce(sum(bonds), 0)::int into v_neufs, v_bonds from poses;

  if v_bonds > 0 then
    insert into public.bond_transactions
      (user_id, amount, transaction_type, description, reference_type)
    select p_user_id, t.bonds, 'earned',
           'Trophée · ' || t.categorie, 'trophy'
      from public.trophees_gagnes t
     where t.user_id = p_user_id
       and not exists (
         select 1 from bond_transactions bt
          where bt.user_id = p_user_id
            and bt.reference_type = 'trophy'
            and bt.description = 'Trophée · ' || t.categorie
       );

    insert into public.bond_balance (user_id, balance)
    values (p_user_id, v_bonds)
    on conflict (user_id) do update
      set balance = coalesce(public.bond_balance.balance, 0) + v_bonds,
          updated_at = now();
  end if;

  return jsonb_build_object('trophees_neufs', v_neufs, 'bonds_verses', v_bonds);
end;
$$;
