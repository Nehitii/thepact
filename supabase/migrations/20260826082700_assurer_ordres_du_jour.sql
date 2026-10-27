-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-26
-- sans qu un fichier soit ecrit dans le depot. Elle n existait plus
-- que dans « supabase_migrations.schema_migrations », qui garde le SQL
-- de chaque migration en plus de son numero.
--
-- Le contenu ci-dessous est celui du registre, mot pour mot — la prose
-- d origine comprise. Rien n a ete reecrit.
--
-- NE PAS LA REJOUER : elle est deja appliquee. Elle est ici pour que
-- « supabase/migrations » redevienne un compte rendu fidele du schema,
-- et pour qu un environnement neuf puisse etre reconstruit.
-- ═══════════════════════════════════════════════════════════════════

-- LES ORDRES DU JOUR S'ECRIVENT SEULS
--
-- Ils etaient poses par la fonction edge `generate-daily-quests`, que
-- l'utilisateur devait declencher lui-meme avec un bouton. Trois
-- defauts, tous verifies dans les donnees :
--
--   1. Elle filtrait `goals` sur `user_id` — colonne qui N'EXISTE PAS
--      (les objectifs passent par `pacts`). PostgREST renvoyait une
--      erreur, le tableau arrivait vide, et l'ordre « Avancer un pas »
--      n'a jamais pu etre genere.
--   2. Elle lisait une table `habits` qui n'existe pas non plus. Seule
--      `habit_logs` existe. « Tenir le rituel » n'a jamais existe.
--   3. Aucune tache planifiee n'appelle cette fonction : son mode cron
--      est du code mort. Sans clic, aucun ordre.
--
-- Preuve : sur toute l'histoire de la table, deux genres seulement,
-- quatre fois chacun, sur quatre jours depuis mai. Le declencheur de
-- PROGRESSION, lui, porte deja le commentaire « goals has no user_id
-- column; resolve via pacts » — le bug avait ete corrige d'un seul cote.
--
-- On adopte ici la convention que le projet emploie deja pour les
-- offres de la boutique : une fonction « assurer », idempotente,
-- appelee a l'ouverture. Pas de cron a planifier, pas de fonction edge
-- a reveiller, pas de quota d'IA consomme pour un insert deterministe —
-- et surtout pas de bouton a presser pour recevoir sa propre journee.
--
-- Le jour est celui d'UTC, comme dans `_bump_quest_progress` et les
-- declencheurs. Un jour local serait plus juste pour l'utilisateur,
-- mais il faudrait changer les quatre en meme temps : mieux vaut rester
-- coherent que corriger a moitie.
create or replace function public.assurer_ordres_du_jour()
returns setof public.daily_quests
language plpgsql
security definer
set search_path to 'public'
as $function$
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
        -- L'ordre du rang decide lequel tombe quand il reste moins de
        -- trois places : d'abord ce qui touche au pacte.
        ('complete_steps', 'Avancer un pas',
         'Termine une etape d''une de tes missions.', 1, 15, 1, 'pas'),
        ('log_habit', 'Tenir le rituel',
         'Valide deux habitudes aujourd''hui.', 2, 12, 2, 'rituel'),
        ('journal_entry', 'Conscience ecrite',
         'Note une pensee dans le Chronolog.', 1, 10, 3, 'toujours'),
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
     where (c.besoin = 'toujours')
        or (c.besoin = 'pas' and d.a_des_pas)
        or (c.besoin = 'rituel' and d.a_des_rituels)
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

revoke all on function public.assurer_ordres_du_jour() from public, anon;
grant execute on function public.assurer_ordres_du_jour() to authenticated;

comment on function public.assurer_ordres_du_jour() is
  'Complete les ordres du jour manquants pour auth.uid() et les renvoie tous. Idempotente : appelable a chaque ouverture.';
