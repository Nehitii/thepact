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
-- COMMENT LE BLASON SE POSE SUR LA BANNIERE
-- ═══════════════════════════════════════════════════════════════
--
-- Une seule disposition — l embleme accroche en bas a gauche — ne va
-- pas a toutes les images. Une banniere dont le sujet est au centre se
-- fait couper ; un embleme large etouffe une banniere discrete.
--
-- Trois poses, donc, et c est la guilde qui choisit :
--   coin   · l embleme mord le coin bas-gauche de la banniere
--   centre · l embleme est pose au milieu, comme un ecu ; le nom dessous
--   ruban  · la banniere se reduit a un bandeau, l embleme precede le nom

alter table public.guilds
  add column if not exists blason_pose text not null default 'coin';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'guilds_blason_pose_connue'
  ) then
    alter table public.guilds
      add constraint guilds_blason_pose_connue
      check (blason_pose in ('coin', 'centre', 'ruban'));
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- LE FOND DE L EMBLEME
-- ═══════════════════════════════════════════════════════════════
--
-- Un embleme detoure est transparent. Depose sur la plaque, il laisse
-- voir le fond de l application — gris sombre — quelle que soit la
-- couleur de la guilde. On peut desormais choisir ce qu il y a
-- derriere ; laisse vide, la plaque garde son fond neutre.

alter table public.guilds add column if not exists emblem_bg text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'guilds_emblem_bg_hexadecimal'
  ) then
    alter table public.guilds
      add constraint guilds_emblem_bg_hexadecimal
      check (emblem_bg is null or emblem_bg ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end $$;

comment on column public.guilds.blason_pose is
  'Comment l embleme se pose sur la banniere : coin, centre ou ruban.';
comment on column public.guilds.emblem_bg is
  'Couleur derriere un embleme transparent. Nulle = la plaque garde son fond neutre.';
