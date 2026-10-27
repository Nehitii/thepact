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

-- Correction d'une priorite d'operateurs dans la version precedente.
--
-- La clause etait ecrite :
--     where (besoin='toujours')
--        or (besoin='pas' and a_des_pas)
--        or (besoin='rituel' and a_des_rituels)
--       and not exists (deja pose aujourd'hui)
--
-- AND lie plus fort que OR : le garde-fou anti-doublon ne s'appliquait
-- donc qu'a la DERNIERE branche. Les trois autres genres pouvaient etre
-- inseres une seconde fois — et cette fonction est appelee a chaque
-- ouverture de la page, donc le doublon serait arrive vite.
--
-- Le filtre de pertinence et le filtre d'unicite sont maintenant deux
-- conditions distinctes, chacune entre ses propres parentheses.
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
        -- Le rang decide lequel tombe quand il reste moins de trois
        -- places : d'abord ce qui touche au pacte.
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
