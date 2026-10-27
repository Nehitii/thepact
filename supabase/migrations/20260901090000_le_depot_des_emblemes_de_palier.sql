-- LE DEPOT DES EMBLEMES DE PALIER
--
-- L image d un palier — `ranks.logo_url` — etait un champ texte ou l on
-- collait une adresse. Coller une adresse suppose que l image existe
-- deja quelque part, et qu elle y restera : ce n est pas un
-- televersement, c est un pari sur l hebergement de quelqu un d autre.
--
-- Ce depot est calque sur `finance-icons`, qui sert la meme chose pour
-- les creanciers depuis le debut : public en lecture, ecriture reservee
-- au dossier qui porte l identifiant du membre.
--
-- LA REGLE TIENT DANS `storage.foldername(name))[1]` : le chemin
-- televerse est `<user_id>/<horodatage>.webp`, et la politique compare
-- son premier segment a `auth.uid()`. Personne n ecrit sous le dossier
-- d un autre, personne ne supprime l embleme d un autre.

INSERT INTO storage.buckets (id, name, public)
VALUES ('rank-images', 'rank-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload rank images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'rank-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- La lecture est ouverte : l embleme s affiche sur la carte publique
-- d un profil, que son visiteur soit connecte ou non.
CREATE POLICY "Anyone can view rank images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rank-images');

CREATE POLICY "Users can update their rank images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'rank-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- LA SUPPRESSION EST CE QUI MANQUAIT LE PLUS. Sans elle, chaque essai
-- d embleme laisserait un fichier que personne ne nettoiera jamais :
-- supprimer un palier doit pouvoir emporter son image.
CREATE POLICY "Users can delete their rank images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'rank-images' AND auth.uid()::text = (storage.foldername(name))[1]);
