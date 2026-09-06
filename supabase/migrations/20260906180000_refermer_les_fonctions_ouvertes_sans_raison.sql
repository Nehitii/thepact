-- ═══════════════════════════════════════════════════════════════════
-- REFERMER LES FONCTIONS QUE PERSONNE N APPELLE
-- ═══════════════════════════════════════════════════════════════════
--
-- ⚠ NE PAS APPLIQUER CE FICHIER PAR « supabase db push ».
--
-- Les deux historiques de migration ont diverge. Releve du 06/09 par
-- « supabase migration list --linked » :
--
--     43 migrations des deux cotes
--    149 locales absentes du distant   <- ce que « db push » rejouerait
--    194 distantes absentes du local
--
-- La plus ancienne des 149 date du 22 novembre 2025. « db push » les
-- rejouerait toutes, dans l ordre, sur un schema qui a avance depuis
-- par 194 autres — il echouerait en chemin, apres avoir peut-etre
-- deja ecrit.
--
-- Ce fichier s applique donc SEUL : par l editeur SQL du projet, ou
-- par psql sur la chaine de connexion. Ses vingt-deux signatures ont
-- ete verifiees contre « pg_proc » le 06/09 — toutes se resolvent.
-- ═══════════════════════════════════════════════════════════════════
--
-- Soixante-treize fonctions « security definer » etaient executables
-- par tout compte connecte via /rest/v1/rpc/. Elles contournent les
-- politiques RLS par definition : c est leur raison d etre, et c est
-- pour cela qu on ne les expose que quand on s en sert.
--
-- Le releve : le depot appelle 46 RPC, toutes nommees en clair — aucun
-- appel dynamique, le grep est donc exhaustif. Vingt fonctions
-- exposees n etaient appelees nulle part.
--
-- ═══ TROIS ETAIENT VRAIMENT OUVERTES ═══
--
-- Elles prennent un identifiant d utilisateur EN PARAMETRE, contournent
-- les politiques, et ne verifient jamais qui appelle :
--
--   log_guild_activity(p_guild_id, p_user_id, p_action, p_metadata)
--     un INSERT nu. N importe quel compte connecte pouvait ecrire une
--     ligne de journal dans n importe quelle guilde, au nom de
--     n importe qui.
--
--   rattraper_les_succes(p_user_id)
--     recalcule et accorde les succes d un utilisateur arbitraire.
--
--   contribution_membre(p_user_id, p_debut, p_fin)
--     lit la contribution d un autre membre sur une fenetre choisie.
--
-- ═══ POURQUOI REVOQUER PLUTOT QUE CORRIGER ═══
--
-- On aurait pu leur ajouter un « if p_user_id <> auth.uid() then raise ».
-- Mais AUCUNE n est appelee : ecrire une regle d autorisation pour une
-- fonction dont on ne connait pas l usage prevu, c est deviner. Le
-- droit se rend en une ligne le jour ou la fonctionnalite arrive, et
-- d ici la la surface n existe plus.
--
-- ═══ CE QU ON NE REVOQUE PAS, ET POURQUOI ═══
--
-- « is_guild_member », « get_guild_role » et « peut_ecrire_a » sont
-- appelees DANS DES POLITIQUES RLS. Une expression de politique
-- s evalue avec les droits de celui qui interroge : sans EXECUTE, toute
-- requete sur les tables concernees echouerait par « permission denied
-- for function ». Elles restent ouvertes, et c est correct.
--
-- Cinq autres — add_guild_xp, contribution_membre, current_season,
-- est_admin_eleve, xp_du_membre — sont appelees depuis d autres
-- fonctions. Verifie une par une : les neuf appelantes sont toutes
-- « security definer » et aucune n est un declencheur. A l interieur,
-- le role effectif est le proprietaire, qui garde son droit. La
-- revocation ne les touche pas.
-- ═══════════════════════════════════════════════════════════════════

-- ── Les trois qui acceptaient une cible sans verifier l appelant ──
revoke execute on function public.log_guild_activity(p_guild_id uuid, p_user_id uuid, p_action text, p_metadata jsonb) from anon, authenticated;
revoke execute on function public.rattraper_les_succes(p_user_id uuid) from anon, authenticated;
revoke execute on function public.contribution_membre(p_user_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone) from anon, authenticated;

-- ── Celles qui ne servent qu au-dedans d autres fonctions ──
revoke execute on function public.add_guild_xp(p_guild_id uuid, p_amount integer, p_reason text) from anon, authenticated;
revoke execute on function public.current_season() from anon, authenticated;
revoke execute on function public.est_admin_eleve() from anon, authenticated;
revoke execute on function public.xp_du_membre(p_user_id uuid) from anon, authenticated;

-- ── Celles que rien n appelle, nulle part ──
--    Elles decrivent des fonctionnalites qui n ont pas ete branchees.
--    Le jour ou l une arrive, un « grant execute » d une ligne la
--    rouvre — et l on saura alors quelle autorisation lui ecrire.
revoke execute on function public.assurer_ordres_du_jour() from anon, authenticated;
revoke execute on function public.claim_quest(_quest_id uuid) from anon, authenticated;
revoke execute on function public.enregistrer_appel(p_pact_id uuid, p_jour date) from anon, authenticated;
revoke execute on function public.get_community_profile(p_user_id uuid) from anon, authenticated;
revoke execute on function public.get_community_profiles(p_user_ids uuid[]) from anon, authenticated;
revoke execute on function public.get_mutual_friends_count(p_user_id uuid, p_other_id uuid) from anon, authenticated;
revoke execute on function public.mark_achievements_seen(p_achievement_keys text[]) from anon, authenticated;
revoke execute on function public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date) from anon, authenticated;
revoke execute on function public.rate_template(_template_id uuid, _rating smallint, _review text) from anon, authenticated;
revoke execute on function public.use_streak_freeze(_goal_id uuid, _date date) from anon, authenticated;

-- ── Deux fonctions de declencheur exposees au public ──
--    Elles rendent « trigger » : appelees directement, Postgres refuse
--    (« trigger functions can only be called as triggers »). Le risque
--    est nul, mais un avis qui reste allume pour rien finit par cacher
--    ceux qui comptent.
revoke execute on function public.marquer_les_repartages_orphelins() from anon, authenticated;
revoke execute on function public.verifier_le_repartage() from anon, authenticated;

-- ── Le chemin de recherche des trois dernieres fonctions mutables ──
--    Aucune n est « security definer », donc le risque est faible : elles
--    s executent avec les droits de l appelant. On le fixe quand meme,
--    et a VIDE plutot qu a « public » : « pseudonyme_de » n emploie que
--    des fonctions de pg_catalog, toujours implicitement dans le chemin,
--    et « pas_d_adresse_en_pseudo » qualifie deja son appel en entier.
alter function public.pseudonyme_de(p_id uuid) set search_path = '';
alter function public.pas_d_adresse_en_pseudo() set search_path = '';
alter function public.categories_cosmetiques() set search_path = '';
