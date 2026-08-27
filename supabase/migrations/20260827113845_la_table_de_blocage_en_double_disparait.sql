-- ═══════════════════════════════════════════════════════════════
-- LA TABLE DE BLOCAGE EN DOUBLE DISPARAÎT
--
-- Il en existait DEUX pour une seule idée :
--
--   · `blocked_users` — remplie par l'écran de vie privée, lue par
--     `peut_ecrire_a()` et par la recherche d'alliés. C'est elle qui
--     bloque réellement.
--   · `user_blocks`   — vide depuis toujours, câblée à aucun écran,
--     consultée par aucune politique. Son unique lecteur était un
--     hook que personne n'importait, supprimé à l'audit.
--
-- POURQUOI LA SUPPRIMER PLUTÔT QUE LA LAISSER DORMIR : elle porte
-- quatre politiques RLS d'apparence sérieuse et un nom parfaitement
-- crédible. Un développeur — ou moi dans six mois — qui y brancherait
-- un écran de blocage croirait avoir posé un verrou, et n'aurait rien
-- posé du tout. Une table morte qui a l'air vivante coûte plus cher
-- qu'une table absente.
--
-- RELEVÉ AVANT SUPPRESSION : 0 ligne, 0 fonction qui la lit, 0
-- référence dans le code applicatif. Rien n'est perdu parce qu'il n'y
-- a jamais rien eu.
-- ═══════════════════════════════════════════════════════════════

-- Refus si elle s'est remplie entre le relevé et l'exécution : on ne
-- supprime pas des données sur la foi d'une mesure d'il y a dix
-- minutes.
do $$
declare n integer;
begin
  select count(*) into n from public.user_blocks;
  if n > 0 then
    raise exception 'user_blocks contient % ligne(s) : suppression annulée.', n;
  end if;
end $$;

drop table public.user_blocks;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_blocks'
  ) then
    raise exception 'user_blocks est toujours là.';
  end if;
  -- La vraie table de blocage, elle, doit rester.
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'blocked_users'
  ) then
    raise exception 'blocked_users a disparu — ce n''était pas le but.';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER : recréer la table depuis la migration qui l'avait
-- introduite. Elle n'aurait toujours aucun usage.
-- ═══════════════════════════════════════════════════════════════
