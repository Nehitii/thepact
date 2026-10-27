-- ═══════════════════════════════════════════════════════════════
-- LE GÉNÉRATEUR DES ORDRES DU JOUR ENTRE DANS LE DÉPÔT
--
-- Cette migration ne change RIEN en production : la fonction y existe
-- déjà, mot pour mot. Elle répare un écart d'une autre nature — le
-- dépôt ne savait pas décrire ce qui fait vivre la carte des ordres.
--
-- CE QUI S'EST PASSÉ
--
-- Le 26/08/2026, le commit d9b33303 a constaté que la fonction Edge
-- `generate-daily-quests` ne pouvait pas fonctionner : elle filtrait
-- `goals` sur une colonne `user_id` qui n'existe pas (les objectifs
-- passent par `pacts`) et lisait une table `habits` qui n'existe pas
-- davantage. Mesuré le 27/08/2026 :
--
--   select count(*) from information_schema.columns
--    where table_schema='public' and table_name='goals'
--      and column_name='user_id';                        -- 0
--   select count(*) from information_schema.tables
--    where table_schema='public' and table_name='habits'; -- 0
--
-- Ce commit l'a remplacée par `assurer_ordres_du_jour()`, qui prend le
-- bon chemin — `steps → goals → pacts` — et lit `habit_logs`, la table
-- qui existe. La carte s'est mise à se remplir : trois ordres par jour
-- et par utilisateur depuis le 26/08, contre deux genres épars avant.
--
-- MAIS CE COMMIT N'A TOUCHÉ AUCUNE MIGRATION. La fonction a été créée
-- directement en production. Le dépôt décrivait donc encore un ancien
-- monde : il contenait le fossile cassé, et pas son remplaçant vivant.
--
-- POURQUOI CELA COMPTE
--
-- Une base reconstruite depuis `supabase/migrations/` n'aurait pas eu
-- `assurer_ordres_du_jour`. `useDailyQuests` appelle cette fonction et
-- rien d'autre : la carte des ordres du jour aurait rendu une erreur
-- PostgREST à chaque ouverture de l'accueil, sans qu'aucun test ni
-- aucun typecheck ne le voie — les types générés, eux, la connaissent,
-- puisqu'ils sont lus sur la production.
--
-- Le fossile est supprimé dans le même commit, du dépôt et de la
-- production. On ne pouvait pas retirer le mort sans inscrire le vif.
--
-- CE QUE CONTIENT CETTE MIGRATION
--
-- La définition exacte relevée en production par `pg_get_functiondef`
-- le 27/08/2026, et les droits relevés dans la même passe :
--
--   proacl : postgres=X/postgres | authenticated=X/postgres
--            | service_role=X/postgres
--
-- PUBLIC n'y figure pas — la migration 20260827141935 lui a retiré le
-- droit d'exécuter. Les `revoke`/`grant` ci-dessous le maintiennent sur
-- une base neuve, où `create function` redonnerait EXECUTE à PUBLIC.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.assurer_ordres_du_jour()
 RETURNS SETOF public.daily_quests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid    uuid := auth.uid();
  v_jour   date := (now() at time zone 'UTC')::date;
  v_saison uuid;
  v_place  int;
begin
  if v_uid is null then
    return;
  end if;

  -- Trois ordres par jour, jamais plus : ce qui manque, et rien d'autre.
  select 3 - count(*) into v_place
    from public.daily_quests
   where user_id = v_uid and date = v_jour;

  if v_place > 0 then
    select id into v_saison from public.current_season();

    insert into public.daily_quests
      (user_id, season_id, date, kind, title, description, target, reward_bonds)
    select v_uid, v_saison, v_jour, c.kind, c.titre, c.description, c.cible, c.prime
      from (values
        -- Le rang decide lequel tombe quand il reste moins de trois
        -- places : d'abord ce qui touche au pacte.
        ('complete_steps', 'Avancer un pas',
         'Termine une étape d''une de tes missions.', 1, 15, 1, 'pas'),
        ('log_habit', 'Tenir le rituel',
         'Valide deux habitudes aujourd''hui.', 2, 12, 2, 'rituel'),
        ('journal_entry', 'Conscience écrite',
         'Note une pensée dans le Chronolog.', 1, 10, 3, 'toujours'),
        ('focus_minutes', 'Focus profond',
         'Cumule vingt-cinq minutes en Focus.', 25, 18, 4, 'toujours')
      ) as c(kind, titre, description, cible, prime, rang, besoin)
     cross join (
       select
         -- Un ordre qu'on ne peut pas tenir n'est pas un ordre : on ne
         -- propose « Avancer un pas » que s'il reste un pas a faire.
         exists (
           select 1
             from public.steps s
             join public.goals g on g.id = s.goal_id
             join public.pacts p on p.id = g.pact_id
            where p.user_id = v_uid
              and s.status::text = 'pending'
              and g.status::text not in ('completed', 'archived')
         ) as a_des_pas,
         exists (
           select 1 from public.habit_logs h where h.user_id = v_uid
         ) as a_des_rituels
     ) as d
     where
       -- 1. l'ordre est tenable
       (
            c.besoin = 'toujours'
         or (c.besoin = 'pas'    and d.a_des_pas)
         or (c.besoin = 'rituel' and d.a_des_rituels)
       )
       -- 2. il n'a pas deja ete pose aujourd'hui
       and not exists (
         select 1 from public.daily_quests q
          where q.user_id = v_uid and q.date = v_jour and q.kind = c.kind
       )
     order by c.rang
     limit v_place;
  end if;

  return query
    select * from public.daily_quests
     where user_id = v_uid and date = v_jour
     order by created_at;
end;
$function$;

REVOKE ALL ON FUNCTION public.assurer_ordres_du_jour() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assurer_ordres_du_jour() TO authenticated, service_role;
