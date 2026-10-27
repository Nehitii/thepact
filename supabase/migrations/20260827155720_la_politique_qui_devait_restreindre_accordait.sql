-- ═══════════════════════════════════════════════════════════════
-- LA POLITIQUE QUI DEVAIT RESTREINDRE ACCORDAIT
--
-- CE QUI ÉTAIT LISIBLE SANS COMPTE
--
-- Sur `wishlist_lists`, la politique `mfa_aal2_requis` était déclarée
-- PERMISSIVE et posée sur le rôle `public`. Les quatre-vingt-huit autres
-- tables portent la même politique en RESTRICTIVE, sur `authenticated`.
-- Une seule table sur quatre-vingt-neuf.
--
-- La différence n'est pas un détail de vocabulaire :
--
--   RESTRICTIVE  →  ET.  La condition s'ajoute aux autres : elle RETIRE.
--   PERMISSIVE   →  OU.  La condition s'ajoute aux autres : elle DONNE.
--
-- L'expression est `(NOT a_un_second_facteur()) OR (aal = 'aal2')`. Pour
-- un visiteur sans compte, `auth.uid()` est nul, `a_un_second_facteur()`
-- rend faux, `NOT faux` rend VRAI — et la politique permissive ouvre
-- TOUTE la table.
--
-- MESURÉ, avant cette migration, sous le rôle `anon` :
--
--   « Mes envies » appartient a cfc6582d… ;
--   « Maison »    appartient a cfc6582d… ;
--
-- Deux noms de listes, et surtout l'identifiant de leur propriétaire —
-- qui est la clé de toutes les autres recherches. La clé publiable suffit
-- pour lire ça, et elle est publiable par construction.
--
-- `wishlist_items`, elle, était correcte : les articles ne fuyaient pas.
-- Seuls les noms de listes et l'identifiant du compte.
--
-- CE QUE CETTE MIGRATION FAIT
--
-- Elle remplace la politique par celle des quatre-vingt-huit autres,
-- au mot près. Rien d'inventé : c'est une recopie.
--
-- Après remplacement, un visiteur sans compte retombe sur la politique
-- de lecture ordinaire — `auth.uid() = user_id`, donc nul = user_id,
-- donc zéro ligne. La politique 2FA ne s'applique plus qu'aux comptes
-- connectés, ce qui a toujours été son objet.
--
-- POUR REVENIR EN ARRIÈRE (et rouvrir la table)
--   drop policy mfa_aal2_requis on public.wishlist_lists;
--   create policy mfa_aal2_requis on public.wishlist_lists
--     as permissive for all to public
--     using ((not a_un_second_facteur()) or ((select auth.jwt()->>'aal') = 'aal2'));
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "mfa_aal2_requis" on public.wishlist_lists;

create policy "mfa_aal2_requis"
  on public.wishlist_lists
  as restrictive
  for all
  to authenticated
  using (
    (not public.a_un_second_facteur())
    or ((select auth.jwt() ->> 'aal') = 'aal2')
  );

-- ── VÉRIFICATION ─────────────────────────────────────────────────
do $$
declare
  n int; forme record;
begin
  select permissive, roles::text into forme
  from pg_policies
  where schemaname = 'public' and tablename = 'wishlist_lists'
    and policyname = 'mfa_aal2_requis';

  if forme.permissive <> 'RESTRICTIVE' or forme.roles <> '{authenticated}' then
    raise exception 'ÉCHEC : la politique est % sur % au lieu de RESTRICTIVE sur {authenticated}',
      forme.permissive, forme.roles;
  end if;

  set local role anon;
  select count(*) into n from public.wishlist_lists;
  reset role;

  if n <> 0 then
    raise exception 'ÉCHEC : un visiteur sans compte lit encore % listes', n;
  end if;

  raise notice 'Vérifié : politique RESTRICTIVE sur authenticated, zéro ligne pour anon.';
end $$;
