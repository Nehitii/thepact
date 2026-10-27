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
-- SIX SUCCES MESURAIENT AUTRE CHOSE QUE CE QU ILS ANNONCENT
-- ═══════════════════════════════════════════════════════════════
--
--   « Health Devotee — 30 relevés de santé »  mesurait des CONNEXIONS
--   « Night Owl — un objectif entre minuit et 1h » mesurait des CONNEXIONS
--   « Panthéon — débloquez 50 autres succès »  mesurait des OBJECTIFS
--   « Shopaholic — un objet de chaque catégorie » mesurait un TOTAL de 5
--   « Arsenal complet — tous les modules »     exigeait 8 modules sur 6
--   « Omniscient — tous les modules »          idem, et en double
--
-- Les deux derniers sont ingagnables PAR CONSTRUCTION : le seuil de
-- huit a ete fige a une epoque ou l on prevoyait huit modules. Il y en
-- a six. Acheter les six ne suffira jamais, et acheter le septieme est
-- impossible. On cesse de figer un nombre : la condition devient
-- « tous ceux qui existent », et elle restera vraie quel qu en soit le
-- compte demain.
--
-- LE SEUIL DES AUTRES SUCCES N EST PAS TOUCHE. Cent objectifs faciles
-- ou mille etapes visent un usage plus lourd que le votre, mais rien
-- n interdit a quelqu un d y arriver — ce sont des paliers, pas des
-- erreurs. Seules les conditions FAUSSES sont corrigees.

alter table public.achievement_definitions
  add column if not exists actif boolean not null default true;

comment on column public.achievement_definitions.actif is
  'Faux pour un succes retire du jeu — un doublon, typiquement. Rien n est supprime : la ligne reste, et se rallume en une commande.';

-- ── Les conditions fausses ──────────────────────────────────────

update public.achievement_definitions
   set conditions = jsonb_build_object('type', 'health_checkins', 'value', 30)
 where key = 'health_30_checkins';

update public.achievement_definitions
   set conditions = jsonb_build_object('type', 'objectif_franchi_de_nuit', 'value', true)
 where key = 'hidden_midnight_goal';

update public.achievement_definitions
   set conditions = jsonb_build_object('type', 'succes_debloques', 'value', 50)
 where key = 'legend_master_all';

update public.achievement_definitions
   set conditions = jsonb_build_object('type', 'toutes_categories_cosmetiques', 'value', true)
 where key = 'hidden_shopaholic';

update public.achievement_definitions
   set conditions = jsonb_build_object('type', 'tous_les_modules', 'value', true)
 where key in ('shop_all_modules', 'legend_all_modules');

-- Le rang gagne se deduit de l XP : inutile de guetter l instant.
update public.achievement_definitions
   set conditions = jsonb_build_object('type', 'rang_gagne', 'value', true)
 where key = 'fate_unbound';

-- Huit etapes en un jour se lit dans les horodatages. Le guetter au
-- moment ou il se produit condamne tout ce qui a eu lieu avant.
update public.achievement_definitions
   set conditions = jsonb_build_object('type', 'huit_etapes_en_un_jour', 'value', true)
 where key = 'the_checkmate_day';

-- ── LES DOUBLONS ────────────────────────────────────────────────
--
-- Trois paires ont EXACTEMENT la meme condition, sans rien pour les
-- distinguer : elles s ouvrent au meme instant et paient deux fois le
-- meme geste. On en eteint une de chaque, celle dont la categorie se
-- passe le mieux d elle — rien n est supprime, la ligne reste et se
-- rallume en une commande si l avis change.
--
--   1000 etapes  : « La ligne sans fin » (Series, 2 membres) est gardee ;
--                  « Arpenteur » (Legendes, 5 membres) s efface.
--   3 minutes    : « Briseur d'echo » (Temps, 3 membres) est garde ;
--                  « Demon de vitesse » (Secrets, 8 membres) s efface.
--   tous modules : « Omniscient » (Legendes) est garde — posseder tout
--                  est une legende ; « Arsenal complet » (Boutique,
--                  8 membres) s efface.

update public.achievement_definitions set actif = false
 where key in ('legend_1000_steps', 'hidden_speed_demon', 'shop_all_modules');

-- Un succes eteint qui aurait ete accorde ne doit plus compter.
delete from public.user_achievements
 where achievement_key in ('legend_1000_steps', 'hidden_speed_demon', 'shop_all_modules');
