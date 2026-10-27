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
-- JUGER LES CENT SUCCES, SUR LES VRAIES MESURES
-- ═══════════════════════════════════════════════════════════════
--
-- DEUX SCHEMAS DE CONDITION COHABITAIENT sans que personne les
-- reconcilie. Quatre-vingt-treize succes portent { type, value } ;
-- les sept succes de sante portent { type, count } ou { type, days }.
-- Du code qui lit conditions.value ne voyait rien chez ces
-- sept-la : AUCUN N A JAMAIS PU S OUVRIR.
--
-- Le seuil est donc pris ou il se trouve — value, count ou days —
-- plutot que d exiger des donnees qu elles se conforment.
--
-- La fonction rend aussi L AVANCEMENT, pas seulement l acquis : un
-- succes verrouille sans jauge ne dit pas s il est a portee ou hors
-- d atteinte, et c est pourtant la seule chose qui donne envie.

create or replace function public.succes_du_membre(p_user_id uuid)
returns table (
  cle text,
  nom text,
  categorie text,
  rarete text,
  description text,
  saveur text,
  icone text,
  cache boolean,
  points integer,
  bonds integer,
  mesure text,
  seuil numeric,
  valeur numeric,
  obtenu boolean,
  obtenu_le timestamptz,
  avancement numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mesures jsonb;
begin
  v_mesures := public.mesures_du_membre(p_user_id);

  return query
  with juge as (
    select d.key, d.name, d.category, d.rarity, d.description, d.flavor_text,
           d.icon_key, d.is_hidden, coalesce(d.points, 0) as points,
           coalesce(d.bond_reward, 0) as bonds,
           d.conditions->>'type' as mesure,
           /* Le seuil est pris ou il se trouve. */
           case
             when jsonb_typeof(d.conditions->'value') = 'boolean' then 1
             else nullif(coalesce(
               d.conditions->>'value', d.conditions->>'count', d.conditions->>'days'
             ), '')::numeric
           end as seuil,
           case
             when jsonb_typeof(v_mesures->(d.conditions->>'type')) = 'boolean'
               then case when (v_mesures->>(d.conditions->>'type'))::boolean then 1 else 0 end
             when (v_mesures->>(d.conditions->>'type')) ~ '^-?[0-9]+(\.[0-9]+)?$'
               then (v_mesures->>(d.conditions->>'type'))::numeric
             else null
           end as valeur,
           u.unlocked_at
      from achievement_definitions d
      left join user_achievements u
        on u.achievement_key = d.key and u.user_id = p_user_id
  )
  select j.key, j.name, j.category, j.rarity, j.description, j.flavor_text,
         j.icon_key, j.is_hidden, j.points, j.bonds, j.mesure, j.seuil, j.valeur,
         /* Deja inscrit, ou merite maintenant. Un succes obtenu ne se
            reprend jamais : une mesure qui redescend — une tache
            supprimee, un ami retire — ne doit pas effacer ce qui a ete
            fait. */
         (j.unlocked_at is not null)
           or (j.valeur is not null and j.seuil is not null and j.valeur >= j.seuil),
         j.unlocked_at,
         case
           when j.unlocked_at is not null then 1
           when j.seuil is null or j.seuil <= 0 or j.valeur is null then 0
           else least(1, round(j.valeur / j.seuil, 4))
         end
    from juge j;
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- LE RATTRAPAGE
-- ═══════════════════════════════════════════════════════════════
--
-- Inscrit ce qui est merite et n a jamais ete accorde, parce que le
-- compteur qui en decidait s etait ecarte. Ne retire rien : un succes
-- obtenu reste obtenu, meme si la mesure redescend ensuite.
--
-- « seen » reste faux : la page pourra donc les annoncer, ce qui est
-- exactement ce qu on veut pour des succes gagnes il y a des mois et
-- jamais montres.

create or replace function public.rattraper_les_succes(p_user_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_ajoutes integer;
begin
  insert into public.user_achievements (user_id, achievement_key, unlocked_at, progress, seen)
  select p_user_id, s.cle, now(), 100, false
    from public.succes_du_membre(p_user_id) s
   where s.obtenu and s.obtenu_le is null
  on conflict do nothing;

  get diagnostics v_ajoutes = row_count;
  return v_ajoutes;
end;
$$;
