-- L ARCHIVE DE NOVEMBRE
--
-- La table finance est vide d USAGE mais pas de SENS, et cette nuance
-- ne se lit nulle part — ce qui la met en danger a chaque audit.
--
-- Elle porte novembre 2025 : 2450 euros de revenus, 1500 de depenses.
-- Ces montants ne sont nulle part ailleurs. monthly_finance_validations,
-- qui l a remplacee, ne commence qu en janvier 2026. La supprimer
-- effacerait le seul temoignage de ce mois-la.
--
-- On ne la migre pas non plus : elle ne retient que des totaux, sans le
-- detail par ligne qu attend le pointage. L y verser produirait un mois
-- valide affichant « 0 pointe sur 1500 » — une fidelite pire que
-- l archive telle quelle.
--
-- Le commentaire n est donc pas decoratif. C est ce qui empechera le
-- prochain passage — humain ou agent — de refaire le raisonnement a
-- moitie et de conclure « zero ligne lue, donc supprimable ». Une
-- decision qui ne survit pas a celui qui l a prise n est pas une
-- decision, c est un sursis.

comment on table public.finance is
  'ARCHIVE — NE PAS SUPPRIMER. Remplacee par monthly_finance_validations '
  'depuis janvier 2026, mais conserve novembre 2025, absent de la nouvelle '
  'table. Aucun code ne la lit : c est voulu. Ses totaux n ont pas le detail '
  'par ligne qu exige le pointage, donc elle ne peut pas y etre migree sans '
  'perte de sens.';
