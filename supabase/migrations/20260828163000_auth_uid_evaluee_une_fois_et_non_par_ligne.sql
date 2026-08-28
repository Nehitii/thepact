-- ═══════════════════════════════════════════════════════════════
-- `auth.uid()` ÉVALUÉE UNE FOIS, ET NON À CHAQUE LIGNE
--
-- 293 politiques sur 102 tables écrivaient `auth.uid() = user_id`.
-- PostgreSQL réévalue alors la fonction POUR CHAQUE LIGNE examinée.
-- Écrite `(select auth.uid()) = user_id`, elle devient un InitPlan :
-- évaluée une fois, réutilisée. La valeur est identique — auth.uid()
-- est STABLE — seul le nombre d'évaluations change.
--
-- L'analyseur Supabase compte 381 avis `auth_rls_initplan` pour ces
-- 293 politiques (certaines cumulent USING et WITH CHECK).
--
-- POURQUOI MAINTENANT, ALORS QUE RIEN NE SE VOIT. À 4 comptes, 189
-- étapes et 66 tâches, la différence est nulle et le restera longtemps.
-- Elle apparaît quand l'application marche : c'est une dette dont
-- l'échéance est le succès. La corriger coûte une migration
-- aujourd'hui ; plus tard elle coûtera un diagnostic sous pression.
--
-- ═══ CE QUI REND CETTE MIGRATION DÉLICATE ═══
--
-- On ne réécrit pas 293 expressions à la main : on demande au
-- catalogue la sienne, on y insère l'enveloppe, on la lui rend. Le
-- risque n'est donc pas la transformation — c'est l'aller-retour. Si
-- PostgreSQL reformulait l'expression au passage, une politique
-- pourrait changer de sens sans que rien ne le signale.
--
-- D'OÙ L'ASSERTION DE RETOUR, qui est le cœur de ce fichier : on garde
-- l'état d'avant, et après coup on retire l'enveloppe du texte obtenu
-- pour vérifier qu'on retombe EXACTEMENT sur l'original. Une seule
-- différence, et la migration échoue avant de valider.
--
-- Note de forme : PostgreSQL redéparse `(select auth.uid())` en
-- `( SELECT auth.uid() AS uid)`. L'alias fait partie de sa
-- normalisation, pas de notre écriture — l'assertion en tient compte.
--
-- ═══ CE QU'ON NE TOUCHE PAS ═══
--
-- Les 88 politiques RESTRICTIVE `mfa_aal2_requis` citent `auth.jwt()`,
-- mais DÉJÀ enveloppée : `( SELECT (auth.jwt() ->> 'aal'))`. Elles ne
-- sont pas concernées. Aucune politique n'utilise `current_setting`.
-- ═══════════════════════════════════════════════════════════════

begin;

create temporary table _avant on commit drop as
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ 'auth\.uid\(\)'
  and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) !~ '\( SELECT auth\.uid\(\)';

do $$
declare
  r record;
  q text;
  c text;
begin
  for r in select * from _avant loop
    q := replace(r.qual, 'auth.uid()', '( SELECT auth.uid() )');
    c := replace(r.with_check, 'auth.uid()', '( SELECT auth.uid() )');

    if r.qual is not null and r.with_check is not null then
      execute format('alter policy %I on public.%I using (%s) with check (%s)',
                     r.policyname, r.tablename, q, c);
    elsif r.qual is not null then
      execute format('alter policy %I on public.%I using (%s)',
                     r.policyname, r.tablename, q);
    else
      execute format('alter policy %I on public.%I with check (%s)',
                     r.policyname, r.tablename, c);
    end if;
  end loop;
end $$;

do $$
declare
  n int;
  liste text;
begin
  -- (a) aucune politique n'a disparu ni n'est apparue.
  select count(*) into n from pg_policies where schemaname = 'public';
  if n <> 405 then
    raise exception 'le nombre de politiques a changé : attendu 405, trouvé %', n;
  end if;

  -- (b) plus aucune occurrence nue de auth.uid().
  select count(*), coalesce(string_agg(tablename || '.' || policyname, ', '), '—')
    into n, liste
  from pg_policies
  where schemaname = 'public'
    and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ 'auth\.uid\(\)'
    and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) !~ '\( SELECT auth\.uid\(\)';
  if n <> 0 then
    raise exception 'il reste % politique(s) avec auth.uid() nue : %', n, liste;
  end if;

  -- (c) L'ALLER-RETOUR. On retire l'enveloppe du texte obtenu et on
  --     doit retomber sur l'original, caractère pour caractère.
  select count(*), coalesce(string_agg(a.tablename || '.' || a.policyname, ', '), '—')
    into n, liste
  from _avant a
  join pg_policies p
    on p.schemaname = 'public' and p.tablename = a.tablename and p.policyname = a.policyname
  where coalesce(regexp_replace(p.qual, '\( SELECT auth\.uid\(\) AS uid\)', 'auth.uid()', 'g'), '')
        is distinct from coalesce(a.qual, '')
     or coalesce(regexp_replace(p.with_check, '\( SELECT auth\.uid\(\) AS uid\)', 'auth.uid()', 'g'), '')
        is distinct from coalesce(a.with_check, '');
  if n <> 0 then
    raise exception '% politique(s) ne retombent pas sur leur expression d''origine : %', n, liste;
  end if;

  raise notice 'aller-retour vérifié sur % politiques', (select count(*) from _avant);
end $$;

commit;
