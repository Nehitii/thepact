-- L'UNITE EST UN AFFICHAGE, PAS UN STOCKAGE.
--
-- `hydration_glasses` reste la verite : c'est un entier, l'historique
-- est deja rempli avec, et Analytics comme la suggestion de rythme le
-- lisent tel quel. Changer l'unite stockee reecrirait tout le passe pour
-- un gout de presentation.
--
-- On note donc seulement DANS QUELLE LANGUE le montrer. Un verre vaut
-- 25 cl : six verres s'affichent « 1,5 L » sans rien perdre en route,
-- et la bascule est reversible a tout instant.
alter table public.health_settings
  add column if not exists hydration_unit text not null default 'glasses';

alter table public.health_settings
  drop constraint if exists health_settings_hydration_unit_check;

alter table public.health_settings
  add constraint health_settings_hydration_unit_check
  check (hydration_unit in ('glasses', 'liters'));

comment on column public.health_settings.hydration_unit is
  'Unite d''AFFICHAGE de l''hydratation. Le stockage reste hydration_glasses (entier, 1 verre = 25 cl).';
