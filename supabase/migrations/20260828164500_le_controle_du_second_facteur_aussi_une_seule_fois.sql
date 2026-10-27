-- ═══════════════════════════════════════════════════════════════
-- LE CONTRÔLE DU SECOND FACTEUR AUSSI, UNE SEULE FOIS
--
-- La migration précédente a enveloppé `auth.uid()` dans 293 politiques
-- et fait tomber les avis `auth_rls_initplan` de 381 à 88. Les 88 qui
-- restent sont les politiques RESTRICTIVE `mfa_aal2_requis`, une par
-- table protégée :
--
--   ((NOT a_un_second_facteur())
--    OR (( SELECT (auth.jwt() ->> 'aal')) = 'aal2'))
--
-- La moitié droite est déjà enveloppée. La gauche ne l'est pas, et
-- `a_un_second_facteur()` est donc appelée POUR CHAQUE LIGNE — sur 88
-- tables, c'est-à-dire presque toutes les lectures de l'application.
--
-- ELLE EST STABLE, vérifié dans pg_proc : l'envelopper dans un
-- sous-requête scalaire ne change pas sa valeur, seulement le nombre
-- d'appels. C'est la même transformation que la précédente, appliquée
-- au même endroit pour la même raison.
--
-- CES POLITIQUES SONT LE GARDE-FOU LE PLUS IMPORTANT DE LA BASE : en
-- RESTRICTIVE, elles se combinent en ET avec toutes les autres, donc
-- une politique permissive oubliée ne peut pas les contourner. Les
-- toucher demande la même assertion d'aller-retour que la précédente,
-- et la vérification qu'elles restent bien RESTRICTIVE après coup.
-- ═══════════════════════════════════════════════════════════════

begin;

create temporary table _avant_mfa on commit drop as
select tablename, policyname, qual, with_check, permissive, roles::text as roles
from pg_policies
where schemaname = 'public'
  and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'a_un_second_facteur\(\)'
  and (coalesce(qual, '') || coalesce(with_check, '')) !~ '\( SELECT a_un_second_facteur\(\)';

do $$
declare r record;
begin
  for r in select * from _avant_mfa loop
    execute format('alter policy %I on public.%I using (%s)',
                   r.policyname, r.tablename,
                   replace(r.qual, 'a_un_second_facteur()', '( SELECT a_un_second_facteur() )'));
  end loop;
end $$;

do $$
declare n int; liste text;
begin
  -- (a) plus aucune occurrence nue.
  select count(*) into n from pg_policies
  where schemaname = 'public'
    and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'a_un_second_facteur\(\)'
    and (coalesce(qual, '') || coalesce(with_check, '')) !~ '\( SELECT a_un_second_facteur\(\)';
  if n <> 0 then
    raise exception 'il reste % politique(s) appelant a_un_second_facteur() par ligne', n;
  end if;

  -- (b) ELLES RESTENT RESTRICTIVE ET SUR LE MÊME RÔLE. Une politique
  --     du second facteur qui redeviendrait permissive cesserait de
  --     protéger quoi que ce soit.
  select count(*), coalesce(string_agg(a.tablename, ', '), '—') into n, liste
  from _avant_mfa a
  join pg_policies p on p.schemaname='public' and p.tablename=a.tablename and p.policyname=a.policyname
  where p.permissive is distinct from a.permissive or p.roles::text is distinct from a.roles;
  if n <> 0 then
    raise exception '% politique(s) ont changé de nature ou de rôle : %', n, liste;
  end if;

  -- (c) l'aller-retour, caractère pour caractère.
  select count(*), coalesce(string_agg(a.tablename, ', '), '—') into n, liste
  from _avant_mfa a
  join pg_policies p on p.schemaname='public' and p.tablename=a.tablename and p.policyname=a.policyname
  where regexp_replace(p.qual, '\( SELECT a_un_second_facteur\(\) AS a_un_second_facteur\)', 'a_un_second_facteur()', 'g')
        is distinct from a.qual;
  if n <> 0 then
    raise exception '% politique(s) ne retombent pas sur leur expression d''origine : %', n, liste;
  end if;
end $$;

commit;
