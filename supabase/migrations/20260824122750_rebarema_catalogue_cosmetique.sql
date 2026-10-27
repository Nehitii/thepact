-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-24
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

-- ECHELLE UNIQUE POUR TOUS LES COSMETIQUES.
--
-- Constat mesure : un module coute 2 200 bonds ou 19,99 EUR. L ancre
-- donne 1 bond ~ 0,0091 EUR. Le cadre Void etait a 2 000 bonds, soit
-- 18,20 EUR : 91 % du prix d un module fonctionnel, pour une decoration.
-- Dans le meme temps une banniere common valait 650 quand une rare
-- valait 500, et une epic etait gratuite. La rarete n ordonnait rien.
--
-- Barreme retenu, identique pour cadres, bannieres et titres :
--   par defaut     0
--   common        50
--   rare         200
--   epic         500
--   legendary  1 000
--
-- Les titres suivaient deja une grille coherente (0/300/300/800/1500) ;
-- elle sert de modele, arrondie. Les prix des modules ne bougent pas :
-- ils sont adosses a un prix en euros, c est une decision commerciale.

-- 1 · Les huit cadres nommes « Test » ne sont pas des rebuts. Chacun
--     porte une image reelle et une echelle reglee a la main. Ce sont
--     des cadres finis restes sous leur nom de chantier ; on les nomme
--     d apres ce qu ils montrent et on leur donne un rang.
update cosmetic_frames set name = 'Casque Felin',      rarity = 'common'    where name = 'Test';
update cosmetic_frames set name = 'Plume Cyan',        rarity = 'common'    where name = 'Test 2';
update cosmetic_frames set name = 'Eclat de Cristal',  rarity = 'rare'      where name = 'Test 3';
update cosmetic_frames set name = 'Arc Dore',          rarity = 'rare'      where name = 'Test 4';
update cosmetic_frames set name = 'Halo Azur',         rarity = 'epic'      where name = 'Test 5';
update cosmetic_frames set name = 'Flux Violet',       rarity = 'rare'      where name = 'Test 6';
update cosmetic_frames set name = 'Anneau Ecarlate',   rarity = 'epic'      where name = 'Test 7';
update cosmetic_frames set name = 'Brasier Cramoisi',  rarity = 'legendary' where name = 'Test 8';

-- 2 · Le doublon franco-anglais. « Rapunzel » (1 bond, cree le meme jour
--     que les cadres de chantier) et « Raiponce » (650) sont la meme
--     banniere. On retire la copie de chantier ; la ligne de possession
--     reste, personne ne perd rien, et elle n est equipee par personne.
update cosmetic_banners set is_active = false where name = 'Rapunzel';

-- 3 · Le barreme, applique par rarete.
update cosmetic_frames set price = case
  when is_default then 0
  when rarity = 'common'    then 50
  when rarity = 'rare'      then 200
  when rarity = 'epic'      then 500
  when rarity = 'legendary' then 1000
  else price end;

update cosmetic_banners set price = case
  when is_default then 0
  when rarity = 'common'    then 50
  when rarity = 'rare'      then 200
  when rarity = 'epic'      then 500
  when rarity = 'legendary' then 1000
  else price end;

update cosmetic_titles set price = case
  when is_default then 0
  when rarity = 'common'    then 50
  when rarity = 'rare'      then 200
  when rarity = 'epic'      then 500
  when rarity = 'legendary' then 1000
  else price end;
