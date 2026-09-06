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
-- LE RAID : un objectif de guilde nourri par ce que les gens font
-- ═══════════════════════════════════════════════════════════════
--
-- Un objectif de guilde se remplissait jusqu'ici avec UN CHAMP OU
-- L'ON TAPE UN NOMBRE A LA MAIN. Rien ne le reliait a ce que ses
-- membres accomplissaient reellement : on pouvait le remplir sans
-- rien faire, ou tout faire sans qu'il bouge. C'etait un tableur.
--
-- Un raid est defini par QUATRE CIBLES, pas une :
--   etapes validees · objectifs franchis · taches faites · jours ecrits
--
-- Une personne seule couvre mal les quatre. Cinq se repartissent
-- naturellement — c'est la seule reponse honnete a « pourquoi une
-- guilde plutot que mes propres objectifs ». Une cible a zero n'est
-- pas demandee.
--
-- Et un raid A UNE FIN. Il se gagne ou se perd ; il ne stagne pas.

create table if not exists public.guild_raids (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  titre text not null check (length(trim(titre)) between 1 and 80),
  intention text,

  commence_le timestamptz not null default now(),
  finit_le timestamptz not null,

  -- Les quatre cibles. Zero = non demandee.
  cible_etapes integer not null default 0 check (cible_etapes >= 0),
  cible_objectifs integer not null default 0 check (cible_objectifs >= 0),
  cible_taches integer not null default 0 check (cible_taches >= 0),
  cible_journal integer not null default 0 check (cible_journal >= 0),

  -- Fige a la cloture : un raid termine ne doit pas dependre d'un
  -- recalcul sur des donnees qui ont bouge depuis.
  etat text not null default 'en_cours'
    check (etat in ('en_cours', 'reussi', 'echoue')),
  resultat jsonb,
  clos_le timestamptz,

  cree_par uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  check (finit_le > commence_le),
  -- Un raid sans aucune cible ne demande rien.
  check (cible_etapes + cible_objectifs + cible_taches + cible_journal > 0)
);

create index if not exists idx_guild_raids_guilde on public.guild_raids (guild_id, finit_le desc);

comment on table public.guild_raids is
  'Objectif collectif a echeance, dont l''avancement est MESURE sur l''activite reelle des membres et non saisi a la main.';

-- ═══════════════════════════════════════════════════════════════
-- CE QU'UNE PERSONNE A REELLEMENT FAIT SUR UNE PERIODE
-- ═══════════════════════════════════════════════════════════════
--
-- La brique dont tout le reste depend : les raids, les rangs
-- internes, le classement. Elle ne lit que des horodatages deja
-- ecrits par l'application — rien de nouveau a saisir.
--
-- focus_sessions existe mais ne contient aucune ligne : on ne compte
-- pas ce qui n'est jamais alimente.

create or replace function public.contribution_membre(
  p_user_id uuid,
  p_debut timestamptz,
  p_fin timestamptz
)
returns table (etapes integer, objectifs integer, taches integer, journal integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::int
       from steps s
       join goals g on g.id = s.goal_id
       join pacts p on p.id = g.pact_id
      where p.user_id = p_user_id
        and s.validated_at is not null
        and s.validated_at >= p_debut and s.validated_at < p_fin),
    (select count(*)::int
       from goals g
       join pacts p on p.id = g.pact_id
      where p.user_id = p_user_id
        and g.completion_date is not null
        and g.completion_date >= p_debut and g.completion_date < p_fin),
    (select count(*)::int
       from todo_tasks t
      where t.user_id = p_user_id
        and t.completed_at is not null
        and t.completed_at >= p_debut and t.completed_at < p_fin),
    -- Les jours DISTINCTS ou l'on a ecrit : trois entrees le meme
    -- jour ne valent pas trois jours de constance.
    (select count(distinct (j.created_at at time zone 'UTC')::date)::int
       from journal_entries j
      where j.user_id = p_user_id
        and j.created_at >= p_debut and j.created_at < p_fin);
$$;

-- ═══════════════════════════════════════════════════════════════
-- L'AVANCEMENT D'UN RAID, ET QUI L'A PORTE
-- ═══════════════════════════════════════════════════════════════
--
-- Rend les totaux de la guilde et le detail par membre. Le detail
-- n'est pas un ornement : c'est lui qui rend la composition visible
-- — on voit qui couvre quel domaine, et lequel n'est couvert par
-- personne.

create or replace function public.guild_raid_avancement(p_raid_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_raid public.guild_raids;
  v_membres jsonb;
  v_total record;
begin
  select * into v_raid from public.guild_raids where id = p_raid_id;
  if not found then
    return jsonb_build_object('trouve', false);
  end if;

  -- Un raid clos rend ce qui a ete fige, jamais un recalcul.
  if v_raid.resultat is not null then
    return v_raid.resultat || jsonb_build_object('trouve', true, 'fige', true);
  end if;

  select
    coalesce(sum(c.etapes), 0)::int as etapes,
    coalesce(sum(c.objectifs), 0)::int as objectifs,
    coalesce(sum(c.taches), 0)::int as taches,
    coalesce(sum(c.journal), 0)::int as journal
  into v_total
  from public.guild_members m
  cross join lateral public.contribution_membre(m.user_id, v_raid.commence_le, v_raid.finit_le) c
  where m.guild_id = v_raid.guild_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'user_id', m.user_id,
           'etapes', c.etapes,
           'objectifs', c.objectifs,
           'taches', c.taches,
           'journal', c.journal
         ) order by (c.etapes + c.objectifs + c.taches + c.journal) desc), '[]'::jsonb)
  into v_membres
  from public.guild_members m
  cross join lateral public.contribution_membre(m.user_id, v_raid.commence_le, v_raid.finit_le) c
  where m.guild_id = v_raid.guild_id;

  return jsonb_build_object(
    'trouve', true,
    'fige', false,
    'totaux', jsonb_build_object(
      'etapes', v_total.etapes,
      'objectifs', v_total.objectifs,
      'taches', v_total.taches,
      'journal', v_total.journal
    ),
    'membres', v_membres
  );
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- QUI PEUT VOIR ET FAIRE QUOI
-- ═══════════════════════════════════════════════════════════════

alter table public.guild_raids enable row level security;

drop policy if exists "Les membres voient les raids de leur guilde" on public.guild_raids;
create policy "Les membres voient les raids de leur guilde"
  on public.guild_raids for select to authenticated
  using (exists (
    select 1 from public.guild_members m
     where m.guild_id = guild_raids.guild_id and m.user_id = auth.uid()
  ));

drop policy if exists "Les officiers lancent un raid" on public.guild_raids;
create policy "Les officiers lancent un raid"
  on public.guild_raids for insert to authenticated
  with check (
    cree_par = auth.uid()
    and exists (
      select 1 from public.guild_members m
       where m.guild_id = guild_raids.guild_id
         and m.user_id = auth.uid()
         and m.role in ('owner', 'officer')
    )
  );

drop policy if exists "Les officiers closent un raid" on public.guild_raids;
create policy "Les officiers closent un raid"
  on public.guild_raids for update to authenticated
  using (exists (
    select 1 from public.guild_members m
     where m.guild_id = guild_raids.guild_id
       and m.user_id = auth.uid()
       and m.role in ('owner', 'officer')
  ));
