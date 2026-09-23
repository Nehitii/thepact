-- ═══════════════════════════════════════════════════════════════════
-- LA DOUBLE AUTHENTIFICATION GARDE AUSSI LES FONCTIONS
-- ═══════════════════════════════════════════════════════════════════
--
-- ⚠ NE PAS APPLIQUER PAR « supabase db push » — les deux historiques
-- ont diverge, voir l en-tete de 20260906180000. Par l editeur SQL,
-- avec le fichier a coller prepare le 23/09, qui contient aussi la
-- migration du 06/09 et les inscriptions au registre.
--
-- Audit du 22/09. Cinq defauts, une migration.
--
-- ═══ E2 — LES FONCTIONS PASSAIENT AU-DESSUS DU SECOND FACTEUR ═══
--
-- La politique restrictive « mfa_aal2_requis » exige une session aal2
-- sur 84 tables, pour tout compte muni d un facteur. Mais une fonction
-- « security definer » s execute en tant que postgres, proprietaire de
-- ces 84 tables, sans RLS forcee : elle ne voit pas la politique. Avec
-- le seul mot de passe, reset_pact_data effacait tous les objectifs,
-- purchase_* depensait les bonds, settle_contract tranchait un contrat.
--
-- La garde tient en une fonction, exiger_aal2(), appelee en tete des
-- douze fonctions qui agissent au nom de la personne : achats, code
-- promotionnel, recompense, contrats, guildes, remise a zero du pacte.
--
-- CE QU ON NE GARDE PAS, ET POURQUOI. Le suivi de connexion —
-- init_achievement_tracking, update_achievement_tracking,
-- grant_achievement — part AVANT l ecran du second facteur : App.tsx
-- le declenche des que la session s etablit, en aal1. Le garder ferait
-- echouer chaque connexion. Ce qu il ecrit, des compteurs et des
-- succes, releve de M3 — l economie qui croit le client —, pas d une
-- destruction. Le reste de l interface n est joignable qu en aal2
-- (ProtectedRoute renvoie vers /two-factor) : aucun appel legitime ne
-- rencontrera la garde.
--
-- ═══ E3 — LE PANTHEON SE REECRIVAIT A LA DEMANDE ═══
--
-- snapshot_season_leaderboard n avait aucune garde. Chaque appel
-- effacait le pantheon d une saison, le recalculait, AJOUTAIT du
-- prestige au top 10 et redistribuait les recompenses de saison. Seule
-- la fonction cron season-reset s en sert, avec la cle de service.
--
-- ═══ E4 — LES COMPTEURS S ECRIVAIENT CHEZ LES AUTRES ═══
--
-- increment_tracking_counter(p_user_id, …) ne comparait jamais
-- p_user_id a l appelant, et acceptait un increment negatif : tout
-- compte connecte pouvait gonfler ou vider les trente-trois compteurs
-- de succes d un autre. reclamer_les_trophees(p_user_id) suivait le
-- meme motif. Les douze appels du client passent tous l utilisateur
-- connecte (releve du 23/09) : la garde ne casse rien. Un increment
-- nul ou negatif ne fait desormais rien, sans erreur — une seance de
-- focus de zero minute ne doit pas lever.
--
-- ═══ F4 — DEUX FONCTIONS D ADMINISTRATION SANS SESSION ELEVEE ═══
--
-- admin_grant_cosmetic et admin_reset_cosmetic lisaient has_role() ;
-- changer_le_role et diffuser_notification lisent est_admin_eleve(),
-- qui exige aussi aal2. Les deux s alignent.
--
-- ═══ M2 — DEUX DEPOTS PUBLICS SANS GARDE-FOU ═══
--
-- finance-icons et rank-images sont publics, sans type impose ni
-- taille maximale : tout compte connecte y deposait n importe quoi.
-- Le client n y envoie que du webp ou du gif de moins de 80 Ko (releve
-- du 23/09) ; on accepte les formats d image courants, pas le SVG, qui
-- peut porter du script. victory-reels : de la video seulement.
--
-- ═══ COMMENT LES CORPS SONT MODIFIES ═══
--
-- Aucun corps n est reecrit de memoire. Chaque fonction est relue par
-- pg_get_functiondef ; on insere une ligne apres le BEGIN de son corps,
-- ou l on remplace une ligne exacte, puis on execute la definition.
-- CREATE OR REPLACE garde le proprietaire et les droits.
--
-- Une empreinte md5 du corps, relevee le 23/09, garde chaque
-- modification : si une fonction a change depuis, la migration
-- s arrete au lieu de deviner. Rejouee, elle ne fait rien — la ligne
-- est deja la.
--
-- Verifie le 23/09 : aucune politique, aucune vue et aucune fonction
-- « security invoker » n appelle les fonctions dont on retire le droit.
-- ═══════════════════════════════════════════════════════════════════

-- ── La garde ──
create or replace function public.exiger_aal2()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if public.a_un_second_facteur()
     and coalesce((select auth.jwt() ->> 'aal'), '') <> 'aal2' then
    raise exception 'second_facteur_requis'
      using errcode = '42501',
            hint = 'Reconnecte-toi en saisissant ton second facteur, puis reessaie.';
  end if;
end;
$$;

comment on function public.exiger_aal2() is
  'Leve si le compte a un second facteur et que la session n est pas aal2. A appeler en tete des fonctions security definer qui agissent au nom de la personne : elles passent au-dessus de la politique mfa_aal2_requis.';

-- Elle ne s appelle que depuis des fonctions « security definer », qui
-- s executent en tant que postgres : personne d autre n en a besoin.
revoke execute on function public.exiger_aal2() from public, anon, authenticated;

-- ── E2, E4, F4 : les corps ──
do $migration$
declare
  cible record;
  v_def text;
  v_corps integer;
  v_fin integer;
begin
  for cible in
    select c.fonction::regprocedure as fonction, c.empreinte, c.marque, c.avant, c.apres
    from (values
      -- E2 : la garde du second facteur.
      ('public.reset_pact_data(uuid)',                                     'a556236f15eb3a04355f092b8238cd9b', 'exiger_aal2', null::text, E'\n  perform public.exiger_aal2();'),
      ('public.purchase_bundle(uuid)',                                     'f84895b16c7ceed18e1ec5d67b77f6d4', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.purchase_daily_deal(uuid)',                                 '0fd6a963048c58c911be5858fc23256a', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.purchase_shop_item(uuid, text)',                            '038c74cc221b86e500525e5a652a635a', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.redeem_promo_code(text)',                                   'c4b040a56d5e8ce72607ec9c9042f04c', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.claim_notification_reward(uuid)',                           'd3de7c361f58125c04b96a9d56bc0925', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.settle_contract(uuid, text)',                               '21981216e8b96dd8d32a4ef6d80dac4d', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.sign_goal_contract(uuid, text)',                            '095414fea18f1a4ba5ac28fac92d8b6d', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.clore_raid(uuid)',                                          '7b1d08481663e5023f749b722a22952d', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.create_guild_with_owner(text, text, text, text, boolean, integer)', 'b88e81d285898dff489edad3d8bca9a6', 'exiger_aal2', null, E'\n  perform public.exiger_aal2();'),
      ('public.join_guild_via_code(text)',                                 'be73a97797c7c2dda082facfdac73700', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),
      ('public.accept_guild_invite(uuid)',                                 'b99cdcec4bf875e818daf38548da143e', 'exiger_aal2', null,       E'\n  perform public.exiger_aal2();'),

      -- E4 : on ne compte, et on ne reclame, que pour soi.
      ('public.increment_tracking_counter(uuid, text, integer)', '11eab35072fe0c72815ce9fc8632954e', 'on_ne_compte_que_pour_soi', null,
       E'\n  if p_user_id is distinct from auth.uid() then\n    raise exception ''on_ne_compte_que_pour_soi'' using errcode = ''42501'';\n  end if;\n  if p_increment is null or p_increment <= 0 then\n    return;\n  end if;'),
      ('public.reclamer_les_trophees(uuid)', '5dce1e1609eb71ebd63e585f65864820', 'on_ne_reclame_que_pour_soi', null,
       E'\n  if p_user_id is distinct from auth.uid() then\n    raise exception ''on_ne_reclame_que_pour_soi'' using errcode = ''42501'';\n  end if;'),

      -- F4 : la session elevee pour l administration.
      ('public.admin_grant_cosmetic(uuid, uuid, text)', '5bbe5012a80d1ddccfaf164474e92f5f', 'est_admin_eleve',
       'IF NOT public.has_role(auth.uid(), ''admin''::public.app_role) THEN', 'IF NOT public.est_admin_eleve() THEN'),
      ('public.admin_reset_cosmetic(uuid, uuid)', '33bda0883ec7bc8eeb15b5a4fbaa1b65', 'est_admin_eleve',
       'IF NOT public.has_role(auth.uid(), ''admin''::public.app_role) THEN', 'IF NOT public.est_admin_eleve() THEN')
    ) as c(fonction, empreinte, marque, avant, apres)
  loop
    v_def := pg_get_functiondef(cible.fonction);

    if position(cible.marque in v_def) > 0 then
      raise notice '% : deja modifiee, rien a faire', cible.fonction;
      continue;
    end if;

    if (select md5(prosrc) from pg_proc where oid = cible.fonction) is distinct from cible.empreinte then
      raise exception '% a change depuis le 23/09 : la relire avant d appliquer cette migration', cible.fonction;
    end if;

    if cible.avant is null then
      -- Inserer juste apres le BEGIN du corps.
      v_corps := position('$function$' in v_def);
      v_fin := regexp_instr(v_def, '\mbegin\M', greatest(v_corps, 1), 1, 1, 'i');
      if v_corps = 0 or v_fin = 0 then
        raise exception '% : BEGIN introuvable dans le corps', cible.fonction;
      end if;
      v_def := substr(v_def, 1, v_fin - 1) || cible.apres || substr(v_def, v_fin);
    else
      -- Remplacer une ligne qui doit apparaitre exactement une fois.
      if (length(v_def) - length(replace(v_def, cible.avant, ''))) / length(cible.avant) <> 1 then
        raise exception '% : la ligne a remplacer n apparait pas exactement une fois', cible.fonction;
      end if;
      v_def := replace(v_def, cible.avant, cible.apres);
    end if;

    execute v_def;
  end loop;
end
$migration$;

-- ── E3 : le pantheon ne se reecrit plus que par la fonction cron ──
revoke execute on function public.snapshot_season_leaderboard(_season_id uuid, _top integer) from public, anon, authenticated;

-- ── M2 : les depots publics prennent un type et une taille ──
update storage.buckets
   set allowed_mime_types = array['image/webp', 'image/gif', 'image/png', 'image/jpeg', 'image/avif'],
       file_size_limit = 2097152
 where id in ('finance-icons', 'rank-images');

update storage.buckets
   set allowed_mime_types = array['video/*'],
       file_size_limit = 50000000
 where id = 'victory-reels';
