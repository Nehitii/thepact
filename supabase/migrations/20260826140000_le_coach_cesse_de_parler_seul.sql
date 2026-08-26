-- LE COACH CESSE DE PARLER SEUL.
--
-- Compté le 26/08/26, dans cette base :
--
--   604 exécutions de coach-cron-runner depuis le 17 mai, pour 40
--   insights produits. Un insight tous les quinze réveils.
--
--   42 insights au total, dont 36 balayés — 86 % — en 21 heures de
--   moyenne, soit le temps d'ouvrir le panneau une fois.
--
--   coach_cron_runs est devenue LA PLUS GROSSE TABLE DE LA BASE : 604
--   lignes, devant steps (190), goals (39) et journal_entries (7). Le
--   journal de la machine qui pense à l'utilisateur pèse plus lourd que
--   tout ce que l'utilisateur a fait.
--
--   26 messages écrits par l'utilisateur en trois mois, le dernier le
--   16 août. Pendant ce temps la machine en produisait quarante-deux
--   sans qu'on lui demande rien.
--
--   automation-evaluator se réveille toutes les trente minutes —
--   quarante-huit fois par jour — pour évaluer user_automation_rules,
--   qui compte zéro ligne.
--
-- RIEN N'EST SUPPRIMÉ ICI. Les tables gardent leurs données, les Edge
-- Functions restent déployées : seuls les réveils sont désarmés. Voir
-- annulations/20260826140000_annuler.sql pour les rallumer.
--
-- La revue hebdomadaire de l'application (weekly-review, ouverte à la
-- main depuis la barre d'accès rapide) et smart-notifications ne sont
-- PAS concernées : ce n'est pas le coach qui parle, c'est l'agenda.

do $$
declare
  j text;
  reveils constant text[] := array[
    'coach-cron-runner-4h',
    'coach-weekly-digest',
    'automation-evaluator'
  ];
begin
  foreach j in array reveils loop
    if exists (select 1 from cron.job where jobname = j) then
      perform cron.unschedule(j);
      raise notice 'désarmé : %', j;
    else
      raise notice 'déjà absent : %', j;
    end if;
  end loop;
end $$;
