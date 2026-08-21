-- LA GRILLE DES DOUZE MOIS
--
-- La saisie d une cadence demandait deux gestes qui ne se ressemblent
-- pas : choisir « trimestriel » dans une liste, puis designer un mois
-- d ancrage dans un selecteur natif. Il fallait comprendre que le
-- second decidait des trois autres.
--
-- La grille remplace les deux : on coche les mois ou la charge tombe,
-- et la cadence s en deduit. Mais une grille de douze cases sait
-- exprimer des motifs que la base refusait — « tous les deux mois »
-- fait six cases parfaitement regulieres, et la contrainte les
-- rejetait.
--
-- On admet donc tous les diviseurs de douze. Ce n est pas une
-- ouverture arbitraire : un motif qui se repete a l identique d une
-- annee sur l autre a forcement une periode qui divise douze. La
-- contrainte dit maintenant exactement cela, ni plus ni moins.

alter table public.recurring_expenses
  drop constraint if exists recurring_expenses_periode_admise;
alter table public.recurring_expenses
  add constraint recurring_expenses_periode_admise
  check (periode_mois = any (array[1, 2, 3, 4, 6, 12]));

alter table public.recurring_income
  drop constraint if exists recurring_income_periode_admise;
alter table public.recurring_income
  add constraint recurring_income_periode_admise
  check (periode_mois = any (array[1, 2, 3, 4, 6, 12]));
