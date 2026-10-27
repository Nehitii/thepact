/* CE QUE « TOUTES LES DONNEES » EMPORTE.
 *
 * La sauvegarde complete lisait douze tables ; le schema compte
 * quatre-vingt-huit colonnes qui designent une personne. Le fichier
 * annonce « Sauvegarde complete de toutes tes donnees » : il partait
 * sans les conversations avec Mia, sans l agenda, sans les taches, sans
 * les revues ni les seances de souffle. (Audit du 22/09.)
 *
 * Trois listes, et chaque colonne de personne est dans l une d elles —
 * `exportDesDonnees.test.ts` le verifie contre le schema engendre :
 *
 *   - DANS_LES_SECTIONS : deja lues par les sections nommees du
 *     fichier (objectifs, journal, sante, finance, succes, pacte) ;
 *   - TABLES_DU_COMPTE : lues une a une, rangees sous « tables » ;
 *   - NON_EXPORTEES : laissees hors du fichier, chacune pour une raison.
 *
 * Toutes les tables de TABLES_DU_COMPTE ont une colonne `id` : c est
 * elle qui ordonne la lecture par pages, sans quoi une table de plus de
 * mille lignes se couperait en silence.
 */

export const TABLES_DU_COMPTE = [
  // Le pacte et ce qui s y rattache.
  ["active_missions", "user_id"],
  ["goal_contracts", "owner_id"],
  ["goal_dependencies", "user_id"],
  ["goal_templates", "created_by"],
  ["shared_goals", "owner_id"],
  ["shared_pacts", "owner_id"],
  ["shared_pacts", "member_id"],
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

  // La sante, au-dela du releve quotidien.
  ["health_settings", "user_id"],
  ["health_streaks", "user_id"],
  ["health_challenges", "user_id"],
  ["seances_de_souffle", "user_id"],

  // L argent, au-dela de la section finance.
  ["pointages_du_mois", "user_id"],
  ["wishlist_items", "user_id"],
  ["wishlist_lists", "user_id"],
  ["shop_wishlist", "user_id"],

  // Le coach.
  ["mia_conversations", "user_id"],
  ["mia_messages", "user_id"],
  ["mia_insights", "user_id"],

  // La progression et ce qu elle a rapporte.
  ["achievement_tracking", "user_id"],
  ["trophees_gagnes", "user_id"],
  ["daily_quests", "user_id"],
  ["ranks", "user_id"],
  ["bond_balance", "user_id"],
  ["bond_transactions", "user_id"],
  ["notifications", "user_id"],
  ["hall_of_fame", "user_id"],
  ["user_cosmetics", "user_id"],
  ["user_module_purchases", "user_id"],
  ["promo_code_redemptions", "user_id"],

  // Le compte.
  ["user_roles", "user_id"],
  ["notification_settings", "user_id"],
  ["security_events", "user_id"],
  ["blocked_users", "user_id"],

  // Les autres.
  ["friendships", "sender_id"],
  ["friendships", "receiver_id"],
  ["community_posts", "user_id"],
  ["community_replies", "user_id"],
  ["community_reactions", "user_id"],
  ["community_reports", "reporter_id"],
  ["victory_reels", "user_id"],
  ["template_ratings", "user_id"],
  ["private_messages", "sender_id"],
  ["private_messages", "receiver_id"],

  // Les guildes.
  ["guilds", "owner_id"],
  ["guild_members", "user_id"],
  ["guild_messages", "user_id"],
  ["guild_activity_log", "user_id"],
  ["guild_announcements", "author_id"],
  ["guild_events", "created_by"],
  ["guild_event_rsvps", "user_id"],
  ["guild_goals", "created_by"],
  ["guild_goal_contributions", "user_id"],
  ["guild_invites", "inviter_id"],
  ["guild_invites", "invitee_id"],
  ["guild_raids", "cree_par"],
] as const;

export type TableDuCompte = (typeof TABLES_DU_COMPTE)[number][0];

/** Lues par les sections nommees de la sauvegarde. */
export const DANS_LES_SECTIONS: readonly string[] = [
  "pacts.user_id",
  "journal_entries.user_id",
  "health_data.user_id",
  "recurring_income.user_id",
  "recurring_expenses.user_id",
  "finance.user_id",
  "monthly_finance_validations.user_id",
  "pact_spending.user_id",
  "user_achievements.user_id",
];

export const NON_EXPORTEES: Readonly<Record<string, string>> = {
  "mfa_recovery_codes.user_id": "secrets du second facteur, meme haches : rien a faire dans un fichier",
  "push_subscriptions.user_id": "cles de chiffrement des appareils abonnes aux notifications",
  "guild_invite_codes.created_by": "codes d entree d une guilde : des cles, pas des donnees",
  "mia_embeddings.user_id": "vecteurs derives des messages, qui sont exportes eux-memes",
  "step_status_history.changed_by": "historique technique des etapes, qui sont exportees elles-memes",
  "ai_usage_daily.user_id": "compteur technique du quota du jour",
  "user_feature_overrides.user_id": "reglage pose par un administrateur",
  "admin_audit_log.admin_user_id": "journal d administration",
  "blocked_users.blocked_user_id": "blocages decides par d autres, sur leur compte",
};
