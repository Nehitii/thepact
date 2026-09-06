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

-- SEPT COSMETIQUES DESSINES POUR VOWPACT.
--
-- Le catalogue dependait pour onze de ses dix-sept cadres d images
-- hebergees ailleurs — huit chez Discord, trois sur postimg. Un lien
-- coupe et la vitrine se vide ; et ce sont des visuels tiers.
--
-- Ceux-ci sont des SVG originaux, servis par l application elle-meme
-- depuis `public/cosmetiques/` et versionnes avec le code. Ils pesent
-- de 800 o a 4 Ko, s animent sans APNG, et ne dependent de personne.
--
-- Les prix suivent le bareme pose le meme jour : common 50, rare 200,
-- epic 500, legendary 1 000.

insert into cosmetic_frames (name, rarity, price, preview_url, border_color, glow_color, show_border, frame_scale, is_active, is_default)
select v.name, v.rarity, v.price, v.url, v.bord, v.halo, false, 1.0, true, false
from (values
  ('Réticule',          'rare',      200, '/cosmetiques/cadre-reticule.svg',          '#22d3ee', 'rgba(34,211,238,0.5)'),
  ('Circuit',           'rare',      200, '/cosmetiques/cadre-circuit.svg',           '#4ade80', 'rgba(74,222,128,0.5)'),
  ('Faille',            'epic',      500, '/cosmetiques/cadre-faille.svg',            '#e879f9', 'rgba(232,121,249,0.5)'),
  ('Couronne d''Orbite', 'legendary', 1000, '/cosmetiques/cadre-couronne-d-orbite.svg', '#fbbf24', 'rgba(251,191,36,0.6)')
) as v(name, rarity, price, url, bord, halo)
where not exists (select 1 from cosmetic_frames f where f.name = v.name);

insert into cosmetic_banners (name, rarity, price, banner_url, preview_url, gradient_start, gradient_end, is_active, is_default)
select v.name, v.rarity, v.price, v.url, v.url, v.debut, v.fin, true, false
from (values
  ('Grille',    'common', 50,  '/cosmetiques/banniere-grille.svg',    '#050912', '#02050c'),
  ('Scanline',  'rare',   200, '/cosmetiques/banniere-scanline.svg',  '#12061d', '#050a18'),
  ('Nébuleuse', 'epic',   500, '/cosmetiques/banniere-nebuleuse.svg', '#05030f', '#1a0b2e')
) as v(name, rarity, price, url, debut, fin)
where not exists (select 1 from cosmetic_banners b where b.name = v.name);
