-- ═══════════════════════════════════════════════════════════════
-- LE DROIT D'EXÉCUTER CESSE D'ÊTRE DONNÉ À TOUT LE MONDE
--
-- CE QUI ÉTAIT VRAI AVANT CETTE MIGRATION
--
-- PostgreSQL accorde EXECUTE à PUBLIC sur toute fonction créée, sans
-- qu'on le demande. `anon` est membre de PUBLIC. Résultat mesuré le
-- 27/08/2026 : 67 fonctions applicatives étaient appelables par un
-- visiteur sans compte, dont
--
--   · admin_grant_cosmetic(uuid, uuid, text)  — offrir un cosmétique
--   · purchase_shop_item(uuid, text)          — acheter
--   · redeem_promo_code(text)                 — consommer un code
--   · compter_le_reel(uuid)                   — les compteurs de n'importe qui
--   · has_role(uuid, app_role)                — savoir qui est administrateur
--
-- Ces fonctions vérifient auth.uid() en interne et ne rendaient donc
-- rien d'utile à un anonyme. Mais un droit d'appel qu'on n'a jamais
-- accordé est un droit qu'on ne surveille pas : la prochaine fonction
-- écrite sans clause de garde héritera du même défaut.
--
-- Les révocations du 27/08 (diffuser_notification, peut_ecrire_a…)
-- retiraient à `anon` sans retirer à PUBLIC. Elles étaient donc sans
-- effet là où la ligne `=X/postgres` restait dans l'ACL.
-- C'EST CETTE LIGNE-LÀ QU'IL FAUT RETIRER.
--
-- CE QUE CETTE MIGRATION NE TOUCHE PAS
--
--   · `authenticated`, `service_role`, `postgres` gardent leurs droits
--     explicites. Mesuré : 78 → 77 fonctions (voir plus bas).
--   · Les fonctions de l'extension `vector` : elles appartiennent à
--     l'extension, pas au projet, et leurs opérateurs de type doivent
--     rester appelables. Écartées par `pg_depend.deptype = 'e'`.
--   · Les déclencheurs continuent de se déclencher : PostgreSQL ne
--     vérifie pas EXECUTE au moment où un trigger part.
--
-- LA SEULE PERTE, ET ELLE EST VOULUE
--
-- `compter_le_reel(uuid)` sort des mains de `authenticated`. La
-- migration 20260821120000 la révoquait déjà de `anon, authenticated`
-- — sans retirer PUBLIC, donc sans effet. Cette fonction est un
-- utilitaire appelé par d'autres fonctions SQL, jamais par le client :
-- aucun appel dans `src/`. On termine ce qui avait été commencé.
--
-- MESURÉ AVANT / APRÈS, dans une transaction annulée
--
--   97 fonctions applicatives traitées
--   exécutables par anon : 67 → 0
--   exécutables par authenticated : 78 → 77
--   109 tables lisibles par anon : la seule lecture en échec
--   (`wishlist_lists`) l'était DÉJÀ avant, pour une autre raison.
--
-- POUR REVENIR EN ARRIÈRE
--
--   grant execute on all functions in schema public to anon;
--
-- (rendrait aussi les fonctions d'extension, ce qui est sans risque).
-- ═══════════════════════════════════════════════════════════════

do $$
declare
  f record;
  n int := 0;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
    where ns.nspname = 'public'
      and d.objid is null                      -- pas les fonctions d'extension
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    n := n + 1;
  end loop;

  raise notice 'EXECUTE retiré à PUBLIC et anon sur % fonctions', n;
end $$;

-- ── ET POUR LES SUIVANTES ────────────────────────────────────────
-- Le défaut de PostgreSQL reste le défaut de PostgreSQL : la prochaine
-- fonction créée dans `public` naîtra de nouveau ouverte à PUBLIC.
-- On change le défaut lui-même, pour le rôle qui écrit les migrations.
alter default privileges in schema public
  revoke execute on functions from public;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- ── VÉRIFICATION, DANS LA MIGRATION ELLE-MÊME ────────────────────
-- Une migration qui ne contrôle pas son propre effet n'est qu'une
-- intention. Celle-ci refuse de passer si elle a raté sa cible.
do $$
declare
  restant int;
begin
  select count(*) into restant
  from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
  where ns.nspname = 'public'
    and d.objid is null
    and has_function_privilege('anon', p.oid, 'EXECUTE');

  if restant > 0 then
    raise exception 'ÉCHEC : % fonctions applicatives restent exécutables par anon', restant;
  end if;

  raise notice 'Vérifié : aucune fonction applicative n''est exécutable par anon.';
end $$;
