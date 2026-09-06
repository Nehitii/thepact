-- ANNULER : rouvrir les fonctions refermees le 06/09.
--
-- La migration d origine n a rien detruit : elle a retire un DROIT.
-- L annulation est donc exacte, ligne pour ligne — ce qui n est pas
-- toujours le cas dans ce dossier.
--
-- CE FICHIER EST UN RETOUR EN ARRIERE, PAS UN CORRECTIF. Le rejouer
-- remet en place les trois fonctions qui acceptaient un identifiant
-- d utilisateur sans verifier l appelant :
--
--   log_guild_activity   un INSERT nu dans le journal d une guilde
--   rattraper_les_succes accorde les succes d un utilisateur arbitraire
--   contribution_membre  lit la contribution d un autre membre
--
-- Si l on a besoin de l une d elles, mieux vaut ne rouvrir QUE
-- celle-la, et lui ecrire sa regle d autorisation dans le meme geste.

begin;

grant execute on function public.log_guild_activity(p_guild_id uuid, p_user_id uuid, p_action text, p_metadata jsonb) to anon, authenticated;
grant execute on function public.rattraper_les_succes(p_user_id uuid) to anon, authenticated;
grant execute on function public.contribution_membre(p_user_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone) to anon, authenticated;

grant execute on function public.add_guild_xp(p_guild_id uuid, p_amount integer, p_reason text) to anon, authenticated;
grant execute on function public.current_season() to anon, authenticated;
grant execute on function public.est_admin_eleve() to anon, authenticated;
grant execute on function public.xp_du_membre(p_user_id uuid) to anon, authenticated;

grant execute on function public.assurer_ordres_du_jour() to anon, authenticated;
grant execute on function public.claim_quest(_quest_id uuid) to anon, authenticated;
grant execute on function public.enregistrer_appel(p_pact_id uuid, p_jour date) to anon, authenticated;
grant execute on function public.get_community_profile(p_user_id uuid) to anon, authenticated;
grant execute on function public.get_community_profiles(p_user_ids uuid[]) to anon, authenticated;
grant execute on function public.get_mutual_friends_count(p_user_id uuid, p_other_id uuid) to anon, authenticated;
grant execute on function public.mark_achievements_seen(p_achievement_keys text[]) to anon, authenticated;
grant execute on function public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date) to anon, authenticated;
grant execute on function public.rate_template(_template_id uuid, _rating smallint, _review text) to anon, authenticated;
grant execute on function public.use_streak_freeze(_goal_id uuid, _date date) to anon, authenticated;

grant execute on function public.marquer_les_repartages_orphelins() to anon, authenticated;
grant execute on function public.verifier_le_repartage() to anon, authenticated;

-- Le chemin de recherche redevient mutable. « reset » le remet a la
-- valeur de la session, qui est ce qu il etait avant.
alter function public.pseudonyme_de(p_id uuid) reset search_path;
alter function public.pas_d_adresse_en_pseudo() reset search_path;
alter function public.categories_cosmetiques() reset search_path;

commit;
