-- ═══════════════════════════════════════════════════════════════
-- LA REVUE HEBDOMADAIRE LAISSE UNE INTENTION
--
-- La revue portait deux champs qu'on remplit : une note en étoiles
-- et une réflexion libre. RELEVÉ AVANT CETTE MIGRATION : sur les
-- quatre revues enregistrées en quatre mois, la note est nulle
-- quatre fois et la réflexion nulle quatre fois. Les deux seules
-- parties où l'on demande quelque chose n'ont jamais servi.
--
-- Une revue qui ne produit rien ne se relit pas, donc ne se refait
-- pas. Cette colonne porte la seule chose qu'une semaine puisse
-- léguer à la suivante : ce qu'on se promet d'en faire. La revue
-- d'après la rappellera — c'est ce qui transforme une revue isolée
-- en série.
--
-- Nullable, sans valeur par défaut : les quatre revues existantes
-- n'ont rien promis, et leur inventer une intention serait mentir.
-- ═══════════════════════════════════════════════════════════════

alter table public.weekly_reviews
  add column if not exists next_intention text;

comment on column public.weekly_reviews.next_intention is
  'Ce que la personne se promet pour la semaine suivante. Rappelé en tête de la revue d''après.';

-- Aucune politique à ajouter : les politiques de « weekly_reviews »
-- portent sur la ligne entière et couvrent donc la nouvelle colonne.
