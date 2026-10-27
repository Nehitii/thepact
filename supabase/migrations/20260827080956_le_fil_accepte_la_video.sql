-- ═══════════════════════════════════════════════════════════════
-- LE FIL DE LA COMMUNAUTÉ ACCEPTE LA VIDÉO
--
-- Ce n'était pas une panne : c'était une fonction absente. Le dépôt
-- « community-media » ne déclarait que cinq types d'image, et le
-- client ne proposait qu'eux dans le sélecteur de fichiers. Une
-- vidéo n'a jamais eu la moindre chance d'arriver jusqu'ici.
--
-- ═══ POURQUOI TROIS CONTENEURS, ET PAS PLUS ═══
--
-- mp4 et webm sont lus par tous les navigateurs. « quicktime » est le
-- .mov que produit un iPhone : le refuser reviendrait à refuser la
-- moitié des vidéos qu'on filme réellement. Au-delà (mkv, avi, ogg),
-- on accepterait des fichiers que la balise <video> ne saurait pas
-- afficher — un dépôt réussi suivi d'un lecteur noir est pire qu'un
-- refus immédiat.
--
-- ═══ POURQUOI 25 Mo ═══
--
-- La limite montait à 8 Mo, taillée pour une image et un GIF animé.
-- Elle reste juste pour eux, et le client continue de la leur
-- appliquer. 25 Mo couvre un plan filmé de quelques dizaines de
-- secondes. Les reels de victoire vont jusqu'à 100 Mo, mais ils SONT
-- le format long : un fil se parcourt, il ne se regarde pas.
--
-- Le dépôt ne connaît qu'un seuil, forcément le plus haut : c'est le
-- client qui distingue image et vidéo avant d'envoyer. Le dépôt reste
-- le garde-fou de dernier recours, pas la règle de gestion.
--
-- Rien n'est retiré : les cinq types d'image restent autorisés et
-- aucun fichier existant n'est touché.
-- ═══════════════════════════════════════════════════════════════

update storage.buckets
set allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ],
    file_size_limit = 26214400  -- 25 Mo
where id = 'community-media';

-- Vérification dans la transaction : une migration de dépôt qui ne
-- trouve pas son dépôt doit échouer, pas passer en silence.
do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'community-media'
      and 'video/mp4' = any(allowed_mime_types)
      and file_size_limit = 26214400
  ) then
    raise exception 'Le dépôt community-media n''a pas été mis à jour.';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER — à exécuter à la main :
--
--   update storage.buckets
--   set allowed_mime_types = array[
--         'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
--       file_size_limit = 8388608
--   where id = 'community-media';
--
-- Attention : les vidéos déjà déposées ne disparaîtraient pas, et
-- resteraient lisibles. Seuls les dépôts suivants seraient refusés.
-- ═══════════════════════════════════════════════════════════════
