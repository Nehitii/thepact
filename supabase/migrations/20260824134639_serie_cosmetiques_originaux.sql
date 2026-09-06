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

-- DIX PAR CATEGORIE, TOUS DESSINES POUR VOWPACT.
--
-- Meme regle que la premiere serie : SVG servis depuis
-- `public/cosmetiques/`, versionnes avec le code, sans dependance a un
-- tiers. 70 Ko pour les vingt fichiers. Prix selon le bareme :
-- common 50, rare 200, epic 500, legendary 1 000.
--
-- Les cadres vivent entre les rayons 85 et 128 du gabarit 256 — le
-- disque central appartient a l avatar. Les fonds de carte sont des
-- paysages de 1200 x 300 dont seul le haut se voit sur la carte.

insert into cosmetic_frames (name, rarity, price, preview_url, border_color, glow_color, show_border, frame_scale, is_active, is_default)
select v.name, v.rarity, v.price, v.url, v.bord, v.halo, false, 1.0, true, false
from (values
  ('Ruche', 'rare', 200, '/cosmetiques/cadre-ruche.svg', '#fbbf24', 'rgba(251,191,36,0.5)'),
  ('Ossuaire', 'rare', 200, '/cosmetiques/cadre-ossuaire.svg', '#e7e0d2', 'rgba(231,224,210,0.45)'),
  ('Marée', 'rare', 200, '/cosmetiques/cadre-maree.svg', '#2dd4bf', 'rgba(45,212,191,0.5)'),
  ('Rouages', 'rare', 200, '/cosmetiques/cadre-rouages.svg', '#d9a441', 'rgba(217,164,65,0.5)'),
  ('Prisme', 'epic', 500, '/cosmetiques/cadre-prisme.svg', '#f0abfc', 'rgba(240,171,252,0.5)'),
  ('Sceau', 'epic', 500, '/cosmetiques/cadre-sceau.svg', '#a78bfa', 'rgba(167,139,250,0.55)'),
  ('Foudre', 'epic', 500, '/cosmetiques/cadre-foudre.svg', '#bae6fd', 'rgba(186,230,253,0.6)'),
  ('Vitrail', 'epic', 500, '/cosmetiques/cadre-vitrail.svg', '#fde68a', 'rgba(253,230,138,0.45)'),
  ('Sillage', 'legendary', 1000, '/cosmetiques/cadre-sillage.svg', '#e0f2fe', 'rgba(224,242,254,0.65)'),
  ('Trou Noir', 'legendary', 1000, '/cosmetiques/cadre-trou-noir.svg', '#fb923c', 'rgba(251,146,60,0.6)')
) as v(name, rarity, price, url, bord, halo)
where not exists (select 1 from cosmetic_frames f where f.name = v.name);

insert into cosmetic_banners (name, rarity, price, banner_url, preview_url, gradient_start, gradient_end, is_active, is_default)
select v.name, v.rarity, v.price, v.url, v.url, v.debut, v.fin, true, false
from (values
  ('Sonar', 'common', 50, '/cosmetiques/fond-sonar.svg', '#020c12', '#041018'),
  ('Dunes', 'common', 50, '/cosmetiques/fond-dunes.svg', '#3b1e08', '#1c0f04'),
  ('Cité', 'common', 50, '/cosmetiques/fond-cite.svg', '#0b0620', '#10061c'),
  ('Circuiterie', 'rare', 200, '/cosmetiques/fond-circuiterie.svg', '#040c0a', '#04120f'),
  ('Pluie de Code', 'rare', 200, '/cosmetiques/fond-pluie-de-code.svg', '#020a05', '#041008'),
  ('Météores', 'rare', 200, '/cosmetiques/fond-meteores.svg', '#03040f', '#050818'),
  ('Magma', 'rare', 200, '/cosmetiques/fond-magma.svg', '#140704', '#2a0d05'),
  ('Aurore', 'epic', 500, '/cosmetiques/fond-aurore.svg', '#020617', '#04121a'),
  ('Vortex', 'epic', 500, '/cosmetiques/fond-vortex.svg', '#04040c', '#0a0a1c'),
  ('Cendres', 'legendary', 1000, '/cosmetiques/fond-cendres.svg', '#0a0503', '#1a0806')
) as v(name, rarity, price, url, debut, fin)
where not exists (select 1 from cosmetic_banners b where b.name = v.name);

-- Les titres parlent la langue du pacte : tenir, recommencer, veiller.
insert into cosmetic_titles (title_text, rarity, price, text_color, glow_color, is_active, is_default)
select v.texte, v.rarity, v.price, v.couleur, v.lueur, true, false
from (values
  ('Veilleur', 'common', 50, '#94a3b8', 'rgba(148,163,184,0.4)'),
  ('Insomniaque', 'common', 50, '#a5b4fc', 'rgba(165,180,252,0.4)'),
  ('Serment Tenu', 'rare', 200, '#60a5fa', 'rgba(96,165,250,0.5)'),
  ('Increvable', 'rare', 200, '#34d399', 'rgba(52,211,153,0.5)'),
  ('Main Ferme', 'rare', 200, '#22d3ee', 'rgba(34,211,238,0.5)'),
  ('Architecte du Pacte', 'epic', 500, '#c084fc', 'rgba(192,132,252,0.55)'),
  ('Celui qui Recommence', 'epic', 500, '#f0abfc', 'rgba(240,171,252,0.55)'),
  ('Sans Retour', 'epic', 500, '#fb7185', 'rgba(251,113,133,0.55)'),
  ('Dernier Debout', 'legendary', 1000, '#fbbf24', 'rgba(251,191,36,0.65)'),
  ('Aube Privée', 'legendary', 1000, '#fde68a', 'rgba(253,230,138,0.65)')
) as v(texte, rarity, price, couleur, lueur)
where not exists (select 1 from cosmetic_titles t where t.title_text = v.texte);
