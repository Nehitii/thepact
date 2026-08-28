-- ═══════════════════════════════════════════════════════════════
-- `snapshot_net_worth()` LISAIT DEUX TABLES DISPARUES
--
-- La migration `recentrer_finance_sur_le_pacte`, le 20/08, a supprimé
-- `user_accounts` et `bank_transactions`. Elle n'a pas emporté la
-- fonction qui les lisait.
--
-- `snapshot_net_worth()` construit un instantané de patrimoine à partir
-- des comptes bancaires et de leurs mouvements. Les deux sources
-- n'existent plus : à la première invocation, elle lèverait
-- « relation "user_accounts" does not exist ». Ce n'est pas une
-- fonctionnalité en attente d'un écran, c'est du code qui ne peut plus
-- s'exécuter.
--
-- ═══ POURQUOI LA SUPPRIMER PLUTÔT QUE LA RÉÉCRIRE ═══
--
-- La réécrire demanderait de décider ce qu'est un « patrimoine » dans
-- le modèle actuel, recentré sur le pacte : `recurring_expenses`,
-- `recurring_income` et `pact_spending` décrivent des flux, pas des
-- soldes de comptes. Il n'y a plus de notion de compte bancaire dans
-- cette application. Réécrire, ce serait inventer une fonctionnalité
-- sous couvert de réparation.
--
-- On supprime donc la fonction ET sa table, qui n'a jamais reçu une
-- ligne — vérifié : `net_worth_snapshots` est vide, aucun écran ne la
-- lit, aucune fonction Edge ne la cite, et la seule fonction qui
-- l'alimentait est celle qu'on retire.
--
-- SI LE PATRIMOINE REVIENT UN JOUR, il reviendra avec son modèle de
-- données, et cette table-ci ne lui conviendra pas : ses colonnes
-- décrivent des comptes bancaires qui n'existent plus. La garder
-- « au cas où » ne garderait qu'une forme périmée.
--
-- L'annulation restaure les deux, à l'identique, pour qui voudrait
-- relire ce qui existait.
-- ═══════════════════════════════════════════════════════════════

begin;

drop function if exists public.snapshot_net_worth(date);
drop table if exists public.net_worth_snapshots;

do $$
declare n int;
begin
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'snapshot_net_worth';
  if n <> 0 then raise exception 'snapshot_net_worth existe encore'; end if;

  select count(*) into n from information_schema.tables
   where table_schema = 'public' and table_name = 'net_worth_snapshots';
  if n <> 0 then raise exception 'net_worth_snapshots existe encore'; end if;

  -- Rien d'autre ne doit avoir bougé.
  select count(*) into n from pg_policies where schemaname = 'public';
  if n <> 401 then
    raise exception 'nombre de politiques inattendu : % (405 moins les 4 de net_worth_snapshots)', n;
  end if;
end $$;

commit;
