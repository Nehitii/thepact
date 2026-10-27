/* CE QUE « SUPPRIMER TOUTES MES DONNEES » EFFACE, ET CE QU ELLE GARDE.
 *
 * La liste d origine nommait trente tables. Le schema compte
 * quatre-vingt-huit colonnes qui designent une personne. Apres le
 * message « Toutes tes donnees ont ete reinitialisees » restaient donc
 * toute la memoire de Mia, l agenda, les taches, le focus, les revues,
 * les seances de souffle, les pointages du mois, les envies, les
 * decisions, les valeurs. (Audit du 22/09.)
 *
 * LA REGLE. On efface ce que la personne a produit pour elle-meme, sa
 * progression, et sa parole dans les espaces partages — publications,
 * reponses, reactions, messages. On garde le compte et ce qui le fait
 * tenir — reglages, securite, achats — ainsi que ce qui appartient
 * aussi a d autres : amities, guildes, archives de saison.
 *
 * TROIS TABLES SORTENT DE LA LISTE, EXPRES :
 *   - `blocked_users` : la vider debloquait d un coup tous ceux qu on
 *     avait ecartes ;
 *   - `security_events` : la trace des connexions ne doit pas pouvoir
 *     s effacer avec les donnees ;
 *   - `promo_code_redemptions` : un code utilise le reste, sinon la
 *     reinitialisation le rendait a nouveau.
 *
 * L ORDRE NE PEUT PAS FAIRE ECHOUER L EFFACEMENT : toutes les cles
 * etrangeres entre ces tables sont en `cascade` ou en `set null`
 * (releve de `pg_constraint`, 23/09). Il suit donc la lecture, pas les
 * dependances.
 *
 * `perimetre.test.ts` confronte ces deux listes au schema engendre :
 * une table ajoutee demain le fera echouer tant que personne n aura
 * decide de son sort.
 */
export type Colonne = readonly [table: string, colonne: string];

export const EFFACEES: readonly Colonne[] = [
  // Le pacte et ce qui s y rattache — les objectifs partent par leurs pactes.
  ["active_missions", "user_id"],
  ["goal_contracts", "owner_id"],
  ["goal_dependencies", "user_id"],
  ["goal_templates", "created_by"],
  ["shared_goals", "owner_id"],
  ["shared_pacts", "owner_id"],
  ["shared_pacts", "member_id"],
  ["pact_spending", "user_id"],
  ["life_areas", "user_id"],
  ["user_values", "user_id"],
  ["decisions", "user_id"],
  ["reviews", "user_id"],
  ["weekly_reviews", "user_id"],

  // Le quotidien.
  ["calendar_events", "user_id"],
  ["todo_tasks", "user_id"],
  ["todo_history", "user_id"],
  ["todo_stats", "user_id"],
  ["habit_logs", "user_id"],
  ["habit_skip_rules", "user_id"],
  ["focus_sessions", "user_id"],
  ["focus_distractions", "user_id"],
  ["pomodoro_sessions", "user_id"],
  ["user_automation_rules", "user_id"],
  ["journal_entries", "user_id"],

  // La sante.
  ["health_data", "user_id"],
  ["health_settings", "user_id"],
  ["health_streaks", "user_id"],
  ["health_challenges", "user_id"],
  ["seances_de_souffle", "user_id"],

  // L argent.
  ["finance", "user_id"],
  ["monthly_finance_validations", "user_id"],
  ["pointages_du_mois", "user_id"],
  ["recurring_expenses", "user_id"],
  ["recurring_income", "user_id"],
  ["wishlist_items", "user_id"],
  ["wishlist_lists", "user_id"],
  ["shop_wishlist", "user_id"],

  // Le coach : conversations, memoire, observations.
  ["mia_conversations", "user_id"],
  ["mia_messages", "user_id"],
  ["mia_embeddings", "user_id"],
  ["mia_insights", "user_id"],

  // La progression.
  ["achievement_tracking", "user_id"],
  ["user_achievements", "user_id"],
  ["trophees_gagnes", "user_id"],
  ["daily_quests", "user_id"],
  ["ranks", "user_id"],
  ["bond_balance", "user_id"],
  ["bond_transactions", "user_id"],
  ["notifications", "user_id"],

  // La parole dans les espaces partages.
  ["community_posts", "user_id"],
  ["community_replies", "user_id"],
  ["community_reactions", "user_id"],
  ["community_reports", "reporter_id"],
  ["victory_reels", "user_id"],
  ["template_ratings", "user_id"],
  ["guild_messages", "user_id"],
  ["private_messages", "sender_id"],
  ["private_messages", "receiver_id"],
];

export const GARDEES: Readonly<Record<string, string>> = {
  // Le compte et ce qui le fait tenir.
  "pacts.user_id": "remis a zero, pas efface : l application exige un pacte",
  "user_roles.user_id": "le role du compte, qui survit a ses donnees",
  "notification_settings.user_id": "reglage du compte, pas un contenu",
  "push_subscriptions.user_id": "les appareils abonnes aux notifications du compte",
  "user_feature_overrides.user_id": "reglage pose par un administrateur",
  "ai_usage_daily.user_id": "compteur de quota : l effacer rendrait le quota du jour",

  // La securite.
  "mfa_recovery_codes.user_id": "codes de secours du second facteur",
  "security_events.user_id": "la trace des connexions ne doit pas s effacer avec les donnees",
  "blocked_users.user_id": "la liste de blocage : la vider debloquerait tout le monde d un coup",
  "blocked_users.blocked_user_id": "blocage decide par quelqu un d autre, sur son compte",

  // Les achats.
  "user_cosmetics.user_id": "ce qui a ete achete reste acquis",
  "user_module_purchases.user_id": "les modules achetes restent acquis",
  "promo_code_redemptions.user_id": "un code utilise le reste, sinon la reinitialisation le rendrait",

  // Ce qui appartient aussi a d autres.
  "friendships.sender_id": "le lien appartient aux deux personnes",
  "friendships.receiver_id": "le lien appartient aux deux personnes",
  "guilds.owner_id": "une guilde survit a sa fondatrice ; seule la suppression du compte la ferme",
  "guild_members.user_id": "on quitte une guilde depuis la guilde",
  "guild_activity_log.user_id": "le journal de la guilde est commun",
  "guild_announcements.author_id": "l annonce est l affiche de toute la guilde",
  "guild_events.created_by": "l evenement appartient a la guilde",
  "guild_event_rsvps.user_id": "la presence annoncee compte pour l organisation commune",
  "guild_goals.created_by": "le but appartient a la guilde",
  "guild_goal_contributions.user_id": "la contribution fait l avancement d un but commun",
  "guild_invite_codes.created_by": "le code ouvre la guilde, pas le compte",
  "guild_invites.inviter_id": "l invitation engage aussi la personne invitee",
  "guild_invites.invitee_id": "l invitation vient de quelqu un d autre",
  "guild_raids.cree_par": "le raid appartient a la guilde",
  "hall_of_fame.user_id": "archive des saisons : des rangs figes et publics",

  // Les traces qui ne sont pas des contenus.
  "admin_audit_log.admin_user_id": "journal d administration",
  "step_status_history.changed_by": "suit l etape, pas son auteur : il part avec l objectif",
};

/** Les depots ou chaque personne a un dossier nomme de son identifiant.
 *  `guild-media` n y est pas : il est range par guilde. */
export const DEPOTS_PERSONNELS: readonly string[] = [
  "goal-images",
  "community-media",
  "finance-icons",
  "rank-images",
  "victory-reels",
];
