-- TROIS INTERRUPTEURS SUR QUATRE NE COMMANDAIENT RIEN.
--
-- `notification_settings` porte quatre bascules — système, progrès,
-- social, marketing — et l'énumération `notification_category` porte
-- exactement les quatre mêmes valeurs. Pourtant seule `progress_enabled`
-- était consultée, et par une seule fonction : `smart-notifications`.
--
-- Quatre fonctions insèrent dans `notifications` — automation-evaluator,
-- coach-pattern-detect, coach-weekly-digest, smart-notifications — plus
-- l'écran d'administration. Les faire consulter les préférences une par
-- une aurait laissé la cinquième, et la sixième à venir, hors du compte.
--
-- Le déclencheur se place au seul endroit par lequel tout passe.
-- `return null` sur un BEFORE INSERT abandonne la ligne sans erreur :
-- une notification qu'on ne veut pas n'est pas un échec.
--
-- Ce qui n'est PAS ici : `focus_mode` et les heures calmes. Ils disent
-- QUAND une alerte atteint l'utilisateur, pas s'il en veut — leur place
-- est dans l'envoi, où `push-send` les applique déjà.
create or replace function public.categorie_de_notification_voulue()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  voulu boolean;
begin
  select case new.category
           when 'system'    then ns.system_enabled
           when 'progress'  then ns.progress_enabled
           when 'social'    then ns.social_enabled
           when 'marketing' then ns.marketing_enabled
         end
    into voulu
    from notification_settings ns
   where ns.user_id = new.user_id;

  -- Aucune ligne de préférences : les défauts de la table valent tous
  -- `true`, donc on accepte.
  if voulu is null or voulu then
    return new;
  end if;

  return null;
end;
$$;

comment on function public.categorie_de_notification_voulue() is
  'Abandonne une notification dont la catégorie est désactivée dans notification_settings.';

drop trigger if exists notifications_categorie_voulue on public.notifications;

create trigger notifications_categorie_voulue
  before insert on public.notifications
  for each row
  execute function public.categorie_de_notification_voulue();
