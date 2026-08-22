import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type AchievementCategory =
  | "Connection"
  | "GoalsCreation"
  | "Difficulty"
  | "Time"
  | "Pact"
  | "Finance"
  | "Hidden"
  | "Series"
  | "Todo"
  | "Focus"
  | "Journal"
  | "Social"
  | "Community"
  | "Wishlist"
  | "Calendar"
  | "Shop"
  | "ModuleGated"
  | "Legendary";

export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

/**
 * CE QUE PORTE UNE CONDITION DE SUCCES.
 *
 * La colonne est du Json : elle ne peut pas etre typee par la base. Mais
 * le code n en lit que deux champs, et les asserter nommement vaut mieux
 * que de tout rendre opaque avec un « as any » — qui laissait passer
 * n importe quelle faute de frappe sur condition.type.
 */
export interface ConditionSucces {
  type: string;
  value?: number;
  [autre: string]: unknown;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  category: AchievementCategory;
  description: string;
  flavor_text?: string;
  rarity: AchievementRarity;
  icon_key: string;
  is_hidden: boolean;
  /* Json en base. La condition n est lue que par ses deux champs
     ci-dessous — voir ConditionSucces. */
  conditions: Json;
  unlocked?: boolean;
  unlocked_at?: string;
  progress?: number;
  required_module?: string | null;
  bond_reward?: number;
  points?: number;
}

export const rarityColors: Record<AchievementRarity, string> = {
  common: "hsl(var(--achievement-common))",
  uncommon: "hsl(var(--achievement-uncommon))",
  rare: "hsl(var(--achievement-rare))",
  epic: "hsl(var(--achievement-epic))",
  legendary: "hsl(var(--achievement-legendary))",
  mythic: "hsl(var(--achievement-mythic))",
};

export const categoryIcons: Record<string, string> = {
  Connection: "wifi",
  GoalsCreation: "target",
  Difficulty: "mountain",
  Time: "clock",
  Pact: "handshake",
  Finance: "wallet",
  Hidden: "eye-off",
  Series: "layers",
  Todo: "check-square",
  Focus: "brain",
  Journal: "book-open",
  Social: "users",
  Community: "megaphone",
  Wishlist: "heart",
  Calendar: "calendar",
  Shop: "shopping-bag",
  ModuleGated: "lock",
  Legendary: "crown",
};

// Initialize tracking for a new user (via SECURITY DEFINER RPC)
export async function initializeAchievementTracking(_userId: string) {
  await supabase.rpc('init_achievement_tracking');
}

// Track login event
export async function trackLogin(userId: string) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const { data: tracking } = await supabase
    .from("achievement_tracking")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!tracking) {
    await initializeAchievementTracking(userId);
    return checkAchievements(userId);
  }

  const updates: Record<string, Json> = {};

  const lastLogin = tracking.last_login_date;
  if (lastLogin === today) return;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastLogin === yesterdayStr) {
    updates.consecutive_login_days = (tracking.consecutive_login_days || 0) + 1;
  } else {
    updates.consecutive_login_days = 1;
  }

  updates.last_login_date = today;

  const hourDiff = tracking.usual_login_hour !== null
    ? Math.abs(currentHour - tracking.usual_login_hour)
    : null;

  if (hourDiff !== null && hourDiff <= 0 && currentMinute <= 15) {
    updates.logins_at_same_hour_streak = (tracking.logins_at_same_hour_streak || 0) + 1;
  } else {
    updates.logins_at_same_hour_streak = 1;
    updates.usual_login_hour = currentHour;
  }

  if (currentHour === 0 && currentMinute <= 5) {
    updates.midnight_logins_count = (tracking.midnight_logins_count || 0) + 1;
  }

  await supabase.rpc('update_achievement_tracking', { p_updates: updates });
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
export async function trackGoalCompleted(userId: string, difficulty: string, createdAt: string, completedAt: string) {
  const created = new Date(createdAt);
  const completed = new Date(completedAt);
  const timeDiff = completed.getTime() - created.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

  await supabase.rpc('resynchroniser_compteurs_succes');

  /* Ces quatre-la se jugent sur le temps mis, pas sur un decompte :
     elles restent attachees a l instant du franchissement. */
  if (difficulty === 'impossible' && daysDiff < 30) await unlockAchievement(userId, 'cut_through_time');
  if (difficulty === 'extreme' && hoursDiff < 72) await unlockAchievement(userId, 'warping_path');
  if (difficulty === 'extreme' && hoursDiff < 48) await unlockAchievement(userId, 'blood_of_resolve');
  if (hoursDiff < 0.05) await unlockAchievement(userId, 'echo_breaker');

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

const TRACKABLE_FIELDS = [
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

/* Le controle d execution et le typage disent la meme chose.
   TRACKABLE_FIELDS etait un string[] : le compilateur ne pouvait rien en
   tirer, donc l indexation de la ligne rendait l union de TOUTES ses
   colonnes — dates et booleens compris — que le code comparait ensuite
   avec « >= ». En « as const » plus garde de type, l index se restreint
   aux seules colonnes suivies. */
type ChampSuivi = (typeof TRACKABLE_FIELDS)[number];
const estChampSuivi = (cle: string): cle is ChampSuivi =>
  (TRACKABLE_FIELDS as readonly string[]).includes(cle);

async function checkAchievements(userId: string) {
  const { data: tracking } = await supabase
    .from("achievement_tracking")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!tracking) return;

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
    let shouldUnlock = false;

    // Check if it's a simple trackable field comparison
    if (estChampSuivi(condition.type)) {
      const val = tracking[condition.type];
      shouldUnlock = (val || 0) >= (condition.value as number);
    } else {
      switch (condition.type) {
        case "all_difficulties_created":
          shouldUnlock =
            (tracking.easy_goals_created || 0) > 0 &&
            (tracking.medium_goals_created || 0) > 0 &&
            (tracking.hard_goals_created || 0) > 0 &&
            (tracking.extreme_goals_created || 0) > 0 &&
            (tracking.impossible_goals_created || 0) > 0 &&
            (tracking.custom_goals_created || 0) > 0;
          break;
        case "has_pact":
          shouldUnlock = tracking.has_pact || false;
          break;
        case "has_edited_pact":
          shouldUnlock = tracking.has_edited_pact || false;
          break;
        case "rank_up":
          shouldUnlock = (tracking.current_rank_tier || 1) > 1;
          break;
        case "speed_complete":
          // handled inline in trackGoalCompleted
          break;
      }
    }

    if (shouldUnlock) {
      await unlockAchievement(userId, def.key, def.name, def.rarity as AchievementRarity);
    }
  }
}

// Unlock an achievement via SECURITY DEFINER RPC
export async function unlockAchievement(
  userId: string,
  achievementKey: string,
  achievementName?: string,
  rarity?: AchievementRarity
) {
  const { data } = await supabase.rpc('grant_achievement', {
    p_achievement_key: achievementKey
  });

  // Show notification only if actually unlocked (not already owned)
  if (data === true && achievementName && rarity) {
    const rarityLabel = rarity.charAt(0).toUpperCase() + rarity.slice(1);
    toast.success(`Achievement Unlocked!`, {
      description: `${achievementName} (${rarityLabel})`,
      duration: 5000,
    });
  }
}

// Get user achievements with definitions
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const { data: definitions } = await supabase
    .from("achievement_definitions")
    .select("*")
    .order("category");

  if (!definitions) return [];

  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", userId);

  const { data: tracking } = await supabase
    .from("achievement_tracking")
    .select("*")
    .eq("user_id", userId)
    .single();

  const achievementMap = new Map(
    userAchievements?.map(ua => [ua.achievement_key, ua]) || []
  );

  return definitions.map(def => {
    const condition = def.conditions as unknown as ConditionSucces;
    let progress = 0;
    if (tracking && estChampSuivi(condition.type)) {
      progress = tracking[condition.type] ?? 0;
    }

    return {
      ...def,
      category: def.category as AchievementCategory,
      rarity: def.rarity as AchievementRarity,
      unlocked: achievementMap.has(def.key),
      unlocked_at: achievementMap.get(def.key)?.unlocked_at,
      progress,
      required_module: def.required_module || null,
      bond_reward: def.bond_reward || 0,
      points: def.points || 0,
    };
  }) as Achievement[];
}

// Get achievement statistics
export async function getAchievementStats(userId: string) {
  const achievements = await getUserAchievements(userId);
  const unlocked = achievements.filter(a => a.unlocked);

  const byRarity = unlocked.reduce((acc, a) => {
    acc[a.rarity] = (acc[a.rarity] || 0) + 1;
    return acc;
  }, {} as Record<AchievementRarity, number>);

  const totalPoints = unlocked.reduce((sum, a) => sum + (a.points || 0), 0);

  return {
    total: achievements.length,
    unlocked: unlocked.length,
    percentage: Math.round((unlocked.length / achievements.length) * 100),
    byRarity,
    totalPoints,
    recent: unlocked
      .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
      .slice(0, 5),
  };
}
