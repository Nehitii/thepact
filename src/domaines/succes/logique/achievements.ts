import { supabase } from "@/socle/supabase/client";
import {
  dureeEnHeures, honneursDuTemps, type MesureDeLHonneur,
} from "@/domaines/succes/logique/honneurDuTemps";
import { verdictDuClient } from "@/domaines/succes/logique/deblocage";
import { miseAJourDeConnexion } from "@/domaines/succes/logique/connexion";
import type { Json } from "@/socle/supabase/types";
import { toast } from "sonner";
import i18n from "@/socle/i18n/i18n";
import type {
  AchievementCategory, AchievementRarity, ConditionSucces, Achievement,
} from "@/domaines/succes/types";
/* Reexportes : les appelants importaient ces formes depuis ce fichier. */
export type {
  AchievementCategory, AchievementRarity, ConditionSucces, Achievement,
};

// Initialize tracking for a new user (via SECURITY DEFINER RPC)
export async function initializeAchievementTracking(_userId: string) {
  await supabase.rpc('init_achievement_tracking');
}

// Track login event
export async function trackLogin(userId: string) {
  const { data: tracking } = await supabase
    .from("achievement_tracking")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!tracking) {
    await initializeAchievementTracking(userId);
    return checkAchievements(userId);
  }

  /* Les trois series et leurs deux horloges vivent dans
     logique/connexion.ts, avec leurs tests. */
  const maj = miseAJourDeConnexion(new Date(), tracking);
  if (!maj) return;

  await supabase.rpc('update_achievement_tracking', {
    p_updates: maj as unknown as Record<string, Json>,
  });
  await checkAchievements(userId);
}

/**
 * Les compteurs d objectifs et d etapes se lisent, ils ne s ajoutent plus.
 *
 * Ils suivaient les evenements : +1 a chaque coche, sans memoire de ce
 * qui avait deja ete compte. Decocher puis recocher la meme etape la
 * comptait deux fois, et un objectif acheve autrement que par le bouton
 * « tout completer » ne comptait jamais. Mesure sur le compte de
 * reference avant correction : 132 etapes pour 119 faites, 4 objectifs
 * pour 13 franchis, et les compteurs par palier restes a zero.
 *
 * Le serveur les recalcule desormais depuis les objectifs et les etapes
 * eux-memes — resynchroniser_compteurs_succes(). L appel est idempotent :
 * le repeter ne change rien, et un ecart se referme au premier passage.
 * C est ce qui garantit qu un objectif ne vaut qu une fois, quel que
 * soit le nombre de fois qu on le valide et qu on le devalide.
 */
export async function resynchroniserCompteurs(userId: string) {
  await supabase.rpc('resynchroniser_compteurs_succes');
  await checkAchievements(userId);
}

// Track goal creation
export async function trackGoalCreated(userId: string, _difficulty?: string) {
  await resynchroniserCompteurs(userId);
}

// Track goal completion
/* LA MESURE ENTIERE, ET NON QUATRE ARGUMENTS. Elle porte le depart,
   l achevement et la difficulte ; les deplier obligeait l appelant a
   les remettre dans le bon ordre. Les seuils, l ordre des deblocages
   et la raison de l horloge unique vivent dans
   logique/honneurDuTemps.ts. */
export async function trackGoalCompleted(userId: string, m: MesureDeLHonneur) {
  await supabase.rpc('resynchroniser_compteurs_succes');
  for (const succes of honneursDuTemps(m.difficulte, dureeEnHeures(m.depuis, m.jusqua))) {
    await unlockAchievement(userId, succes);
  }

  await checkAchievements(userId);
}

// Track step completion
export async function trackStepCompleted(userId: string) {
  await resynchroniserCompteurs(userId);
}

// Track pact creation
export async function trackPactCreated(userId: string) {
  await supabase.rpc('update_achievement_tracking', { p_updates: { has_pact: true } });
  await unlockAchievement(userId, 'the_sealed_pact');
}

// Track pact edit
export async function trackPactEdited(userId: string) {
  await supabase.rpc('update_achievement_tracking', { p_updates: { has_edited_pact: true } });
  await unlockAchievement(userId, 'keeper_of_the_oath');
}

// ── New tracking functions ──

export async function trackTodoCompleted(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'todos_completed', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackPomodoroCompleted(userId: string, durationMinutes: number) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'pomodoro_sessions', p_increment: 1
  });
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'pomodoro_total_minutes', p_increment: durationMinutes
  });
  await checkAchievements(userId);
}

export async function trackJournalEntry(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'journal_entries', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackFriendAdded(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'friends_count', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackGuildJoined(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'guilds_joined', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackGuildMessageSent(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'guild_messages_sent', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackCommunityPost(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'community_posts', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackCalendarEventCreated(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'calendar_events_created', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackWishlistItemAdded(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'wishlist_items_added', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackWishlistItemAcquired(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'wishlist_items_acquired', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackModulePurchased(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'modules_purchased', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackCosmeticPurchased(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'cosmetics_owned', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackBondsSpent(userId: string, amount: number) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'bonds_spent_total', p_increment: amount
  });
  await checkAchievements(userId);
}

export async function trackTransactionLogged(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'transactions_logged', p_increment: 1
  });
  await checkAchievements(userId);
}

export async function trackFinanceMonthValidated(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId, p_field: 'finance_months_validated', p_increment: 1
  });
  await checkAchievements(userId);
}

// ── Core check logic ──

/* La decision elle-meme vit dans `deblocage.ts`, avec ses tests : elle
   est la seule autorite pour ce qu elle sait juger, puisque
   `grant_achievement` ne verifie aucune condition. */

/* ═══ ON JUGE SUR LES MESURES, PLUS SUR LES COMPTEURS ═══
 *
 * Cette fonction lisait `achievement_tracking` — des compteurs
 * incrementes a l evenement. `mesures_du_membre` rend la MEME ligne,
 * avec par-dessus ce que le serveur RECOMPTE depuis les tables
 * sources : objectifs, etapes, taches, souhaits, achats, transactions.
 * Les champs que rien ne recompte — la serie de la meme heure, le
 * compteur de minuit, le pacte edite — traversent inchanges.
 *
 * MESURE DU 31/08/2026 SUR LE COMPTE PRINCIPAL : treize compteurs sur
 * vingt divergeaient du reel. Onze etaient trop BAS — le succes
 * n arrivait pas quand il etait merite. DEUX ETAIENT TROP HAUTS :
 * trente sessions de focus pour zero enregistree, sept evenements
 * d agenda pour trois. Et `grant_achievement` ne verifie aucune
 * condition : il insere et CREDITE. Le client pouvait donc faire payer
 * un succes que personne n avait gagne.
 *
 * Verifie avant de changer : aucun succes accorde ne manquait a
 * l appel, et aucun ne s ajoute avec les vraies mesures — le rattrapage
 * serveur avait deja tout donne. Le comportement visible ne bouge pas ;
 * c est la possibilite du mauvais octroi qui disparait.
 */
async function checkAchievements(userId: string) {
  const { data: mesures } = await supabase.rpc("mesures_du_membre", { p_user_id: userId });

  const tracking = mesures as Record<string, unknown> | null;
  if (!tracking || Object.keys(tracking).length === 0) return;

  const { data: definitions } = await supabase
    .from("achievement_definitions")
    .select("*");

  if (!definitions) return;

  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_key")
    .eq("user_id", userId);

  const unlockedKeys = new Set(unlocked?.map(u => u.achievement_key) || []);

  for (const def of definitions) {
    if (unlockedKeys.has(def.key)) continue;

    const condition = def.conditions as unknown as ConditionSucces;

    if (verdictDuClient(condition, tracking) === "debloque") {
      await unlockAchievement(userId, def.key, def.name, def.rarity as AchievementRarity);
    }
  }
}

// Unlock an achievement via SECURITY DEFINER RPC
/* Appelée dans ce fichier seulement — plus exportée : rien au-dehors
   ne débloque un succès à la main, et l ouvrir invitait à le faire. */
async function unlockAchievement(
  userId: string,
  achievementKey: string,
  achievementName?: string,
  rarity?: AchievementRarity
) {
  const { data } = await supabase.rpc('grant_achievement', {
    p_achievement_key: achievementKey
  });

  if (data !== true) return;

  /* L ANNONCE NE PARTAIT QUE SI L APPELANT AVAIT PENSE A PASSER LE NOM
     ET LA RARETE. Six appels sur sept ne passent que la clef — ceux
     des « instants », justement les plus rares : un objectif extreme
     boucle en 48 heures se debloquait DANS LE SILENCE.
     On va chercher ce qui manque plutot que de renoncer. */
  let nom = achievementName;
  let rarete = rarity;
  if (!nom || !rarete) {
    const { data: def } = await supabase
      .from("achievement_definitions")
      .select("name, nom_fr, rarity")
      .eq("key", achievementKey)
      .maybeSingle();
    if (def) {
      nom = nom || (estEnFrancais() ? def.nom_fr || def.name : def.name);
      rarete = rarete || (def.rarity as AchievementRarity);
    }
  }
  if (!nom) return;

  /* Et elle etait en anglais — « Achievement Unlocked! » — avec la
     rarete rendue par une majuscule collee sur la clef brute. */
  toast.success(i18n.t("achievements.justUnlocked", "Succès débloqué"), {
    description: rarete
      ? `${nom} · ${i18n.t(`achievements.rarity.${rarete}`, rarete)}`
      : nom,
    duration: 6000,
  });
}

/** La langue courante, hors de tout composant React. */
function estEnFrancais(): boolean {
  return (i18n.language || "fr").toLowerCase().startsWith("fr");
}

// Get user achievements with definitions
