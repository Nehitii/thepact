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

-- Le nom de l'objectif, copie sur la ligne au moment de la creation.
--
-- Une video de victoire celebre un objectif accompli : sans son nom,
-- elle n'a plus d'objet. Or RLS ne laisse voir que ses propres
-- objectifs, donc la jointure victory_reels -> goals ne rend rien
-- pour la video d'un autre utilisateur, et le fil affichait ces
-- videos sans l'objectif qu'elles celebrent.
--
-- community_posts resout deja ce probleme de la meme facon, avec sa
-- colonne goal_name. On aligne victory_reels dessus.
--
-- La table est vide : aucune ligne a retro-remplir.
alter table public.victory_reels
  add column if not exists goal_name text;

comment on column public.victory_reels.goal_name is
  'Nom de l''objectif au moment de la publication. Denormalise : RLS empeche de lire les objectifs d''autrui.';
