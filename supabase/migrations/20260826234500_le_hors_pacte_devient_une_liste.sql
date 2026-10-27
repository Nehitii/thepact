-- ═══════════════════════════════════════════════════════════════
-- LE « HORS PACTE » DEVIENT UNE LISTE COMME LES AUTRES
--
-- La wish-list connaissait deux natures : les articles rattachés à un
-- objectif du pacte, et les autres — ceux dont « goal_id » est nul.
-- Ce second groupe n'avait pas de nom : il ÉTAIT le trou, tout ce qui
-- ne rentrait nulle part ailleurs.
--
-- Depuis qu'on peut créer des listes nommées, ce trou n'a plus de
-- raison d'être : mieux vaut une liste qu'on baptise et qu'on renomme
-- qu'une catégorie négative. On transforme donc l'orphelinat en
-- liste, plutôt que d'ajouter une troisième notion à côté.
--
-- ═══ RIEN N'EST SUPPRIMÉ, RIEN N'EST DÉPLACÉ HORS DE VUE ═══
--
-- Cette migration ne fait qu'un rattachement : elle crée une liste
-- par personne concernée et pose son identifiant sur les articles qui
-- n'en avaient aucun. Aucun article n'est effacé, aucun n'est modifié
-- autrement que par ce rattachement, et les articles liés à un
-- objectif ne sont pas touchés.
--
-- RELEVÉ AVANT EXÉCUTION : 83 articles au total — 70 rattachés à un
-- objectif, 13 orphelins appartenant à une seule personne, 0 déjà
-- dans une liste. Ce sont ces 13 qui changent de main.
--
-- L'annulation est fournie plus bas en commentaire : elle remet
-- « list_id » à nul et retire la liste créée. Elle est écrite pour
-- être lisible, pas pour être exécutée à la légère.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Une liste par personne qui a des orphelins ──────────────
--
-- Le nom est volontairement fade : « Mes envies » se renomme en deux
-- clics, alors qu'un nom malin qu'on n'a pas choisi agace. Le
-- « sort_order » à -1 la place avant les listes créées ensuite : elle
-- est la plus ancienne, elle passe devant.
--
-- Le déclencheur « trois_listes_au_plus » compte les listes
-- existantes : personne n'en ayant encore, l'insertion passe.

insert into public.wishlist_lists (user_id, name, sort_order)
select distinct i.user_id, 'Mes envies', -1
from public.wishlist_items i
where i.goal_id is null
  and i.list_id is null
  -- Si quelqu'un a déjà une liste de ce nom, on ne la double pas :
  -- l'index unique refuserait, et la migration entière échouerait.
  and not exists (
    select 1 from public.wishlist_lists l
    where l.user_id = i.user_id and lower(btrim(l.name)) = 'mes envies'
  );

-- ── 2. Les orphelins rejoignent cette liste ────────────────────
--
-- On vise la liste par (user_id, nom) plutôt que par un identifiant
-- retenu : la migration reste rejouable, et si elle est relancée après
-- coup elle ne trouvera plus d'orphelin à rattacher.

update public.wishlist_items i
set list_id = l.id,
    updated_at = now()
from public.wishlist_lists l
where l.user_id = i.user_id
  and lower(btrim(l.name)) = 'mes envies'
  and i.goal_id is null
  and i.list_id is null;

-- ── 3. Vérification, dans la transaction ───────────────────────
--
-- Une migration de données qui se trompe en silence est pire que
-- celle qui échoue. On refuse de valider s'il reste un orphelin.

do $$
declare
  restants integer;
begin
  select count(*) into restants
  from public.wishlist_items
  where goal_id is null and list_id is null;

  if restants > 0 then
    raise exception
      'Rattachement incomplet : % article(s) restent sans objectif ni liste.', restants;
  end if;
end $$;

comment on column public.wishlist_items.list_id is
  'La liste nommée à laquelle appartient l''article. Nul uniquement pour les articles rattachés à un objectif du pacte.';

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER — à exécuter à la main, jamais automatiquement :
--
--   update public.wishlist_items i
--   set list_id = null
--   from public.wishlist_lists l
--   where l.id = i.list_id
--     and lower(btrim(l.name)) = 'mes envies'
--     and l.sort_order = -1;
--
--   delete from public.wishlist_lists
--   where lower(btrim(name)) = 'mes envies' and sort_order = -1;
--
-- Attention : si la personne a renommé sa liste entre-temps, ces deux
-- requêtes ne la trouveront plus — et c'est heureux, car elle s'en
-- sera approprié le contenu.
-- ═══════════════════════════════════════════════════════════════
