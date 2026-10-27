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
-- LES IMAGES DES PUBLICATIONS
-- ═══════════════════════════════════════════════════════════════
--
-- POURQUOI UN DEPOT PUBLIC, ET NON goal-images.
--
-- La wishlist range ses images dans goal-images, qui est PRIVE : on y
-- enregistre un chemin, signe au moment de l'affichage. Ce modele ne
-- convient pas ici. Une signature est delivree pour le porteur de la
-- session, et la regle de lecture de ce depot est celle de son
-- proprietaire : personne d'autre ne pourrait afficher l'image d'une
-- publication qui n'est pas la sienne.
--
-- Un fil public affiche des images publiques. Le depot l'est donc
-- aussi : l'URL est stable, sans expiration, et rien a signer a
-- chaque lecture.
--
-- L'ECRITURE, ELLE, RESTE LA SIENNE. La regle exige que le premier
-- dossier du chemin soit l'identifiant de l'auteur, comme partout
-- ailleurs dans le produit.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  8388608, -- 8 Mo : un GIF anime depasse vite une image fixe
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Lecture publique des medias de community" on storage.objects;
create policy "Lecture publique des medias de community"
  on storage.objects for select
  using (bucket_id = 'community-media');

drop policy if exists "Chacun depose dans son dossier" on storage.objects;
create policy "Chacun depose dans son dossier"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'community-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Chacun retire ses medias" on storage.objects;
create policy "Chacun retire ses medias"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'community-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ═══════════════════════════════════════════════════════════════
-- LA COLONNE
-- ═══════════════════════════════════════════════════════════════
--
-- Une seule image par publication : c'est la grammaire de X et
-- d'Instagram pour un fil de texte, et cela evite d'avoir a gerer une
-- galerie, son ordre et sa mise en page a l'interieur d'une ligne.

alter table public.community_posts
  add column if not exists image_url text;

comment on column public.community_posts.image_url is
  'URL publique dans le depot community-media. Une seule image ou GIF par publication.';
