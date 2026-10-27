/* CE QUE LE CLIENT DECIDE D UN SUCCES, ET CE QU IL NE DECIDE PAS.
 *
 * Cette decision etait au milieu d une fonction qui lit trois tables et
 * en ecrit une : rien ne pouvait l interroger. Elle est pourtant la
 * seule autorite pour les succes qu elle sait juger — `grant_achievement`
 * NE VERIFIE AUCUNE CONDITION. Il verifie que la personne est connectee,
 * que la clef existe, que le succes n est pas deja pris, puis il insere
 * ET CREDITE LA RECOMPENSE EN BONDS. Ce que le client dit ici, le
 * serveur le paie.
 *
 * TROIS REPONSES, PAS DEUX. « Pas encore » et « je ne sais pas juger »
 * ne sont pas la meme chose, et les confondre dans un `false` fait
 * disparaitre la seconde. Sur les quarante-huit types de condition que
 * portent les definitions en base, le client en juge TRENTE ; les
 * dix-huit autres sont evaluees par le serveur — `succes_du_membre`
 * les calcule depuis les tables elles-memes, et `rattraper_les_succes`
 * les accorde.
 *
 * C est aussi ce qui rend la garde sure : un type inconnu n est jamais
 * accorde par erreur, il est rendu hors de portee.
 */

import type { ConditionSucces } from "@/domaines/succes/types";

export type { ConditionSucces };

/* Les colonnes de `achievement_tracking` qu une condition peut comparer
 * a un seuil. Le « as const » n est pas cosmetique : en `string[]`, le
 * compilateur rendait l union de TOUTES les colonnes — dates et
 * booleens compris — que le code comparait ensuite avec « >= ». */
export const CHAMPS_SUIVIS = [
  "consecutive_login_days", "logins_at_same_hour_streak", "midnight_logins_count",
  "total_goals_created", "goals_completed_total", "steps_completed_total",
  "easy_goals_completed", "medium_goals_completed", "hard_goals_completed",
  "extreme_goals_completed", "impossible_goals_completed", "custom_goals_completed",
  "todos_completed", "pomodoro_sessions", "pomodoro_total_minutes",
  "journal_entries", "friends_count", "guilds_joined", "guild_messages_sent",
  "community_posts", "wishlist_items_added", "wishlist_items_acquired",
  "modules_purchased", "cosmetics_owned", "calendar_events_created",
  "bonds_spent_total", "bonds_earned_total", "finance_months_validated", "transactions_logged",
] as const;

export type ChampSuivi = (typeof CHAMPS_SUIVIS)[number];

export const estChampSuivi = (cle: string): cle is ChampSuivi =>
  (CHAMPS_SUIVIS as readonly string[]).includes(cle);

/** La ligne de `achievement_tracking`, telle qu elle arrive. */
export type SuiviDuMembre = Record<string, unknown>;

/** « pas-encore » : juge, et non. « hors-de-portee » : pas juge ici. */
export type Verdict = "debloque" | "pas-encore" | "hors-de-portee";

const nombre = (v: unknown): number => (typeof v === "number" ? v : 0);
const vrai = (v: unknown): boolean => v === true;

export function verdictDuClient(condition: ConditionSucces, suivi: SuiviDuMembre): Verdict {
  const oui = (b: boolean): Verdict => (b ? "debloque" : "pas-encore");

  /* LE CAS ORDINAIRE : un compteur contre un seuil. Un seuil qui n est
     pas un nombre rend la comparaison fausse plutot que vraie —
     `0 >= undefined` vaut faux, et c est ce qu on veut : une definition
     mal formee n accorde rien. */
  if (estChampSuivi(condition.type)) {
    return oui(nombre(suivi[condition.type]) >= (condition.value as number));
  }

  switch (condition.type) {
    /* CINQ DIFFICULTES, PAS SIX. La condition s appelle « toutes », mais
       la difficulte SUR MESURE n en fait pas partie cote serveur, qui
       compte `count(distinct difficulty) >= 5`. Ici les six sont
       exigees : le client est donc PLUS SEVERE que le serveur, et c est
       lui qui decide. */
    case "all_difficulties_created":
      return oui(
        nombre(suivi.easy_goals_created) > 0 &&
        nombre(suivi.medium_goals_created) > 0 &&
        nombre(suivi.hard_goals_created) > 0 &&
        nombre(suivi.extreme_goals_created) > 0 &&
        nombre(suivi.impossible_goals_created) > 0 &&
        nombre(suivi.custom_goals_created) > 0,
      );

    case "has_pact":
      return oui(vrai(suivi.has_pact));

    case "has_edited_pact":
      return oui(vrai(suivi.has_edited_pact));

    /* ═══ CONSTATE : CETTE BRANCHE NE PEUT PLUS SE DECLENCHER ═══
       Aucune definition ne porte le type « rank_up ». Celle qui parle
       de rang s appelle « rang_gagne » depuis le 27/08/2026, et le
       serveur la juge en comparant l experience au premier palier. La
       branche reste, pour qu on la voie et qu on la retire en meme
       temps que ce commentaire — la supprimer en silence ferait croire
       que le rang n a jamais ete juge ici. */
    case "rank_up":
      return oui(nombre(suivi.current_rank_tier ?? 1) > 1);

    /* « L INSTANT » SE JUGE AU MOMENT OU IL ARRIVE, pas apres coup : un
       objectif boucle en trois minutes ne laisse aucun compteur
       derriere lui. `trackGoalCompleted` le tranche sur-le-champ. */
    case "speed_complete":
      return "hors-de-portee";

    default:
      return "hors-de-portee";
  }
}
