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

-- DEUX CHOSES QUE LA FONCTION IGNORAIT.
--
-- 1. LES SUCCES ETEINTS. Trois doublons viennent d etre desactives ;
--    ils continueraient a s afficher et a compter.
--
-- 2. LE MODULE REQUIS. La colonne required_module existe depuis le
--    debut et n a jamais ete lue : les huit succes « ModuleGated » se
--    declenchaient sans qu on possede le module qu ils annoncent, au
--    meme instant que leur jumeau non gate — deux fois les points pour
--    le meme geste.

create or replace function public.succes_du_membre(
  p_user_id uuid,
  p_langue text default null
)
returns table (
  cle text, nom text, categorie text, rarete text, description text,
  saveur text, icone text, cache boolean, points integer, bonds integer,
  mesure text, seuil numeric, valeur numeric, obtenu boolean,
  obtenu_le timestamptz, avancement numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mesures jsonb;
  v_fr boolean;
begin
  v_mesures := public.mesures_du_membre(p_user_id);

  v_fr := coalesce(
    lower(coalesce(p_langue, (select pr.language from profiles pr where pr.id = p_user_id))),
    'fr'
  ) like 'fr%';

  return query
  with juge as (
    select d.key,
           case when v_fr then coalesce(d.nom_fr, d.name) else d.name end as nom,
           d.category, d.rarity,
           case when v_fr then coalesce(d.description_fr, d.description) else d.description end as descr,
           case when v_fr then coalesce(d.saveur_fr, d.flavor_text) else d.flavor_text end as saveur,
           d.icon_key, d.is_hidden, coalesce(d.points, 0) as points,
           coalesce(d.bond_reward, 0) as bonds,
           d.conditions->>'type' as mesure,
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
           (d.required_module is null or exists (
              select 1 from user_module_purchases ump
                join shop_modules sm on sm.id = ump.module_id
               where ump.user_id = p_user_id and sm.key = d.required_module
           )) as module_ok,
           u.unlocked_at
      from achievement_definitions d
      left join user_achievements u
        on u.achievement_key = d.key and u.user_id = p_user_id
     where d.actif
  )
  select j.key, j.nom, j.category, j.rarity, j.descr, j.saveur,
         j.icon_key, j.is_hidden, j.points, j.bonds, j.mesure, j.seuil, j.valeur,
         (j.unlocked_at is not null)
           or (j.module_ok and j.valeur is not null and j.seuil is not null and j.valeur >= j.seuil),
         j.unlocked_at,
         case
           when j.unlocked_at is not null then 1
           when j.seuil is null or j.seuil <= 0 or j.valeur is null then 0
           else least(1, round(j.valeur / j.seuil, 4))
         end
    from juge j;
end;
$$;
