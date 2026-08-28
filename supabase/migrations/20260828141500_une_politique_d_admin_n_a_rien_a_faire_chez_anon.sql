-- ═══════════════════════════════════════════════════════════════
-- UNE POLITIQUE D'ADMIN N'A RIEN À FAIRE CHEZ ANON
--
-- L'AUDIT DU 28/08 A TROUVÉ UN ORACLE. Avec la seule clé publiable,
-- sans aucune session :
--
--   POST /rest/v1/rpc/has_role {"_user_id":"<réel>","_role":"admin"}
--     → true
--   POST /rest/v1/rpc/has_role {"_user_id":"<inventé>","_role":"admin"}
--     → false
--
-- Le témoin prouve que la fonction discrimine : n'importe qui peut
-- tester si un identifiant donné est administrateur. Et la chaîne se
-- referme sans compte, parce que `community_posts` livre des `user_id`
-- réels à un visiteur anonyme.
--
-- CE N'ÉTAIT PAS UN OUBLI, ET C'EST CE QUI REND LA CORRECTION DÉLICATE.
-- La migration `20260827155455_une_politique_doit_pouvoir_evaluer_sa_
-- propre_aide` a rendu EXECUTE à `anon` sur exactement cinq fonctions,
-- pour une raison juste : une expression de politique s'évalue avec les
-- droits du rôle qui interroge, donc retirer EXECUTE ne rendait pas
-- « zéro ligne » mais « permission denied for function has_role ».
-- Huit tables avaient cassé ce matin-là.
--
-- RÉVOQUER SANS RIEN D'AUTRE REFERAIT EXACTEMENT LA MÊME CASSE.
-- On ne défait donc pas cette décision : on lui retire sa cause.
--
-- ═══ LE VRAI DÉFAUT EST UN CRAN PLUS HAUT ═══
--
-- Douze politiques citent l'une de ces cinq fonctions ET visent le rôle
-- `public`, qui inclut `anon`. Or aucune n'a de sens pour un visiteur
-- non connecté :
--
--   · onze politiques « Admins can … » — un anonyme n'est jamais
--     administrateur, la clause ne peut être vraie que sous une session.
--   · une politique d'envoi de message privé — elle exige déjà
--     `auth.uid() = sender_id`, impossible sans session.
--
-- Les viser sur `authenticated` ne change donc RIEN au comportement :
-- ce que ces politiques autorisaient à un anonyme était l'ensemble vide.
-- Mais `anon` cesse d'avoir à évaluer les cinq fonctions, et l'EXECUTE
-- qui n'existait que pour ça peut enfin partir.
--
-- Les 88 politiques RESTRICTIVE `mfa_aal2_requis` et les 28 politiques
-- de guilde visent déjà `authenticated` seul — vérifié : elles ne sont
-- pas concernées.
--
-- ═══ COMMENT CETTE MIGRATION SE VÉRIFIE ═══
--
-- Le test de la migration du 27/08 avait conclu « zéro régression » en
-- posant la mauvaise question : `select * … limit 1` laisse le OU
-- court-circuiter avant l'appel à `has_role`. Les assertions ci-dessous
-- comptent, elles ne échantillonnent pas — et elles s'exécutent en
-- prenant le rôle `anon`, pas celui du propriétaire.
-- ═══════════════════════════════════════════════════════════════

begin;

-- ── 1. Les politiques d'administration ne visent plus que les connectés

alter policy "Admins can manage packs"          on public.bond_packs        to authenticated;
alter policy "Admins can manage banners"        on public.cosmetic_banners  to authenticated;
alter policy "Admins can manage frames"         on public.cosmetic_frames   to authenticated;
alter policy "Admins can manage titles"         on public.cosmetic_titles   to authenticated;
alter policy "Admins view cron runs"            on public.mia_cron_runs     to authenticated;
alter policy "Admins can insert notifications"  on public.notifications     to authenticated;
alter policy "Admins can view all promo codes"  on public.promo_codes       to authenticated;
alter policy "Admins can manage promo codes"    on public.promo_codes       to authenticated;
alter policy "season_rewards_admin_manage"      on public.season_rewards    to authenticated;
alter policy "Admins can manage modules"        on public.shop_modules      to authenticated;
alter policy "Admins can manage offers"         on public.special_offers    to authenticated;

-- ── 2. L'envoi de message privé, déjà impossible sans session

alter policy "Users can send messages"          on public.private_messages  to authenticated;

-- ── 3. L'EXECUTE qui n'avait plus de raison d'être

revoke execute on function public.has_role(uuid, public.app_role)            from anon;
revoke execute on function public.get_guild_role(uuid, uuid)                 from anon;
revoke execute on function public.is_guild_member(uuid, uuid)                from anon;
revoke execute on function public.peut_ecrire_a(uuid)                        from anon;
revoke execute on function public.a_un_second_facteur()                      from anon;

-- ── 4. Assertions

do $$
declare
  n int;
  liste text;
begin
  -- (a) plus aucune fonction APPLICATIVE exécutable par anon.
  --     Les fonctions de l'extension pgvector sont exclues : elles ne
  --     nous appartiennent pas et n'exposent aucune donnée.
  select count(*), coalesce(string_agg(p.proname, ', '), '—')
    into n, liste
  from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public'
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and not exists (
      select 1 from pg_depend d
      where d.objid = p.oid and d.deptype = 'e'
    );
  if n <> 0 then
    raise exception 'attendu 0 fonction applicative exécutable par anon, trouvé % : %', n, liste;
  end if;

  -- (b) les cinq fonctions restent exécutables par authenticated —
  --     sinon on a cassé l'application pour ceux qui l'utilisent.
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public'
    and p.proname in ('has_role','get_guild_role','is_guild_member','peut_ecrire_a','a_un_second_facteur')
    and has_function_privilege('authenticated', p.oid, 'EXECUTE');
  if n <> 5 then
    raise exception 'les 5 aides doivent rester exécutables par authenticated, trouvé %', n;
  end if;

  -- (c) plus aucune politique citant ces fonctions ne vise `public`.
  select count(*) into n
  from pg_policies
  where schemaname = 'public'
    and roles::text like '%public%'
    and (coalesce(qual,'') || coalesce(with_check,'')) ~ '(has_role|get_guild_role|is_guild_member|peut_ecrire_a|a_un_second_facteur)';
  if n <> 0 then
    raise exception 'il reste % politique(s) visant public et citant une des cinq aides', n;
  end if;

  -- (d) LE CATALOGUE PUBLIC DOIT TOUJOURS SE LIRE. C'est exactement ce
  --     qui avait cassé le 27/08, et invisible en `limit 1` : on compte,
  --     sous le rôle anon, comme le fait PostgREST.
  set local role anon;
  perform count(*) from public.bond_packs;
  perform count(*) from public.cosmetic_banners;
  perform count(*) from public.cosmetic_frames;
  perform count(*) from public.cosmetic_titles;
  perform count(*) from public.shop_modules;
  perform count(*) from public.mia_cron_runs;
  perform count(*) from public.promo_codes;
  perform count(*) from public.special_offers;
  perform count(*) from public.season_rewards;
  perform count(*) from public.notifications;
  perform count(*) from public.private_messages;
  reset role;
end $$;

commit;
