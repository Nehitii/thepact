-- ═══════════════════════════════════════════════════════════════
-- UNE POLITIQUE DOIT POUVOIR ÉVALUER SA PROPRE AIDE
--
-- CE QUE J'AI CASSÉ CE MATIN, ET QUE MON PROPRE TEST N'A PAS VU
--
-- La migration `le_droit_d_executer_cesse_d_etre_donne_a_tout_le_monde`
-- a retiré EXECUTE à `anon` sur les 67 fonctions applicatives — y compris
-- `has_role(uuid, app_role)`, qui est appelée DANS les politiques RLS de
-- vingt-et-une tables.
--
-- Une expression de politique s'évalue avec les droits du rôle qui
-- interroge. Sans EXECUTE, la politique ne lève pas « zéro ligne » : elle
-- lève « permission denied for function has_role ». Une lecture qui
-- rendait un ensemble vide rend maintenant une erreur.
--
-- MON TEST A CONCLU « ZÉRO RÉGRESSION » PARCE QU'IL POSAIT LA MAUVAISE
-- QUESTION. Il jouait `select * from … limit 1` : la première politique
-- permissive rend vrai, le OU court-circuite, `has_role` n'est jamais
-- appelée. En `select count(*)`, le plan change et l'appel a lieu.
-- Mesuré après coup : huit tables cassées — bond_packs, coach_cron_runs,
-- cosmetic_banners, cosmetic_frames, cosmetic_titles, promo_codes,
-- shop_modules, special_offers.
--
-- Aucune route publique ne lit ces tables, donc rien n'était visible à
-- l'écran. Ça ne rend pas la régression moins réelle : elle attendait la
-- première requête d'une autre forme.
--
-- CE QUE CETTE MIGRATION RÉTABLIT, ET RIEN DE PLUS
--
-- EXECUTE à `anon` sur les CINQ fonctions citées dans une politique d'une
-- table qu'`anon` peut lire. Les soixante-deux autres restent fermées.
--
--   has_role, is_guild_member, get_guild_role  — retirées ce matin
--   a_un_second_facteur, peut_ecrire_a         — jamais accordées, et
--                                                `wishlist_lists` levait
--                                                donc déjà une erreur
--                                                avant mon passage
--
-- CE QUE ÇA COÛTE
--
-- `has_role(uuid, app_role)` redevient appelable sans compte : qui connaît
-- déjà un identifiant peut demander si ce compte est administrateur. Les
-- identifiants ne sont pas énumérables depuis le client (RLS sur
-- `profiles`, et `annuaire_utilisateurs` est fermée à `anon`). Une
-- politique qui ne peut pas s'évaluer coûte plus cher que ça.
--
-- MESURÉ APRÈS APPLICATION
--   109 tables ouvertes à anon, 0 en erreur (contre 9 avant).
--
-- POUR REVENIR EN ARRIÈRE
--   revoke execute on function public.has_role(uuid, app_role) from anon;
--   (et les quatre autres) — en sachant ce que ça rallume.
-- ═══════════════════════════════════════════════════════════════

grant execute on function public.has_role(uuid, app_role)      to anon;
grant execute on function public.is_guild_member(uuid, uuid)   to anon;
grant execute on function public.get_guild_role(uuid, uuid)    to anon;
grant execute on function public.a_un_second_facteur()         to anon;
grant execute on function public.peut_ecrire_a(uuid)           to anon;

-- ── VÉRIFICATION, DANS LA MIGRATION ELLE-MÊME ────────────────────
-- On relit TOUT ce qu'anon peut lire, en `count(*)` — la forme qui
-- déclenche l'évaluation complète des politiques.
do $$
declare
  t record; casses text := ''; n int := 0;
begin
  for t in
    select c.relname from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
    where ns.nspname = 'public' and c.relkind in ('r','v','m')
      and has_table_privilege('anon', c.oid, 'SELECT')
    order by c.relname
  loop
    n := n + 1;
    begin
      set local role anon;
      execute format('select count(*) from public.%I', t.relname);
      reset role;
    exception when others then
      reset role;
      casses := casses || t.relname || ' ';
    end;
  end loop;

  if casses <> '' then
    raise exception 'ÉCHEC : lectures anon encore en erreur -> %', casses;
  end if;

  raise notice 'Vérifié : % tables lisibles par anon, aucune en erreur.', n;
end $$;
