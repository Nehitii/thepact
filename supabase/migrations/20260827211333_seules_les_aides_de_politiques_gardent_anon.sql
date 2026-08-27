-- ═══════════════════════════════════════════════════════════════
-- SUITE DE LA PRÉCÉDENTE : LE MÊME OUBLI, UN CRAN PLUS BAS
--
-- Après avoir retiré PUBLIC de `match_mia_memory`, il restait
-- `anon=X`, hérité cette fois du droit par défaut de Supabase et non
-- de mon `grant`.
--
-- L'INVARIANT ÉTABLI LE 27/08 AU MATIN ÉTAIT POURTANT NET :
-- 67 fonctions exécutables par anon ramenées à 0 (20260827141935),
-- puis exactement 5 rendues (20260827155455) — `has_role`,
-- `is_guild_member`, `get_guild_role`, `a_un_second_facteur`,
-- `peut_ecrire_a` — parce que des politiques RLS les appellent et
-- qu'une politique doit pouvoir évaluer sa propre aide.
-- `match_mia_memory` n'est citée par aucune politique.
--
-- CE QUI A RENDU LE DÉFAUT VISIBLE : sa jumelle. `match_coach_memory`,
-- créée dans la même migration mais PAR-DESSUS une fonction existante,
-- a gardé l'ACL déjà corrigée et n'a donc pas `anon`. Deux fonctions
-- écrites le même soir, l'une avec anon et l'autre sans : la
-- divergence était le signe qu'une des deux avait tort.
--
-- AUCUN RISQUE : M.I.A ne répond qu'à un utilisateur connecté, donc
-- l'appel se fait toujours sous `authenticated`.
--
-- ANNULATION : supabase/migrations/annulations/20260827230600_annuler.sql
-- ═══════════════════════════════════════════════════════════════

revoke execute on function public.match_mia_memory(vector, integer, double precision) from anon;

do $$
declare
  n integer;
  liste text;
begin
  select count(*), coalesce(string_agg(p.proname, ', ' order by p.proname), '')
    into n, liste
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
   where s.nspname = 'public' and d.objid is null
     and coalesce(array_to_string(p.proacl, ','), '') like '%anon=X%';

  if n <> 5 then
    raise exception 'attendu 5 fonctions avec anon (les aides de politiques), trouvé % : %', n, liste;
  end if;

  /* On nomme les cinq attendues : un compte juste avec les mauvaises
     fonctions passerait la garde précédente sans rien dire. */
  if liste <> 'a_un_second_facteur, get_guild_role, has_role, is_guild_member, peut_ecrire_a' then
    raise exception 'ce ne sont pas les 5 attendues : %', liste;
  end if;

  select count(*) into n
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
   where s.nspname = 'public' and p.proname = 'match_mia_memory'
     and array_to_string(p.proacl, ',') like '%authenticated=X%';
  if n <> 1 then
    raise exception 'match_mia_memory n''est plus appelable par authenticated';
  end if;
end $$;
