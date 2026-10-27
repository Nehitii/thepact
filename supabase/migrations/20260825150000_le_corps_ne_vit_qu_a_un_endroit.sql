-- TROIS COLONNES QUE PLUS RIEN NE LIT.
--
-- `profiles.age`, `profiles.weight` et `profiles.height` ont ete
-- verifiees une par une avant de partir :
--
--   aucun acces dans le code applicatif — zero lecture de propriete
--     sur tout src/, alors que les mots « age », « weight » et
--     « height » y apparaissent des centaines de fois (font-weight,
--     max-height, life_areas.weight...)
--   aucune fonction, vue, politique ou index ne les nomme en base
--   aucune fonction edge ne les selectionne
--
-- ET CE QU ELLES CONTENAIENT EXISTE AILLEURS, EN MIEUX :
--
--   age = 29        se deduit de birthday = 1996-02-02, qui est lue
--   height = 186    identique a health_settings.height_cm = 186.00
--   weight = 71     PERIMEE : health_settings.weight_kg vaut 75.00
--
-- La troisieme est l argument decisif. Deux colonnes pour la meme
-- mesure, et elles avaient deja diverge de quatre kilos : le corps ne
-- doit vivre qu a un endroit, et c est health_settings.
--
-- NE SONT PAS SUPPRIMEES, contrairement a ce qui avait ete envisage :
--
--   personal_quote      elle est EN SERVICE. Le grep ne la voyait pas
--                       parce qu elle change de nom a la sortie SQL :
--                       carte_profil_public la renvoie sous la cle
--                       « phrase », et CarteProfilPublic.tsx l affiche
--                       entre guillemets. Un compte en contient une.
--   displayed_badges    vide partout, mais nommee par deux fonctions.
--                       Les retirer demanderait de reecrire ces
--                       fonctions pour un gain nul.
alter table public.profiles drop column if exists age;
alter table public.profiles drop column if exists weight;
alter table public.profiles drop column if exists height;

comment on column public.profiles.personal_quote is
  'EN SERVICE : renvoyee par carte_profil_public sous la cle « phrase », affichee sur la carte publique. Ne pas supprimer.';
