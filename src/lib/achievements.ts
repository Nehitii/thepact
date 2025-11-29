import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AchievementCategory = 
  | "Connection"
  | "GoalsCreation"
  | "Difficulty"
  | "Time"
  | "Pact"
  | "Finance"
  | "Hidden"
  | "Series";

export type AchievementRarity = 
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

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
  conditions: any;
  unlocked?: boolean;
  unlocked_at?: string;
  progress?: number;
}

export const rarityColors: Record<AchievementRarity, string> = {
  common: "hsl(var(--achievement-common))",
  uncommon: "hsl(var(--achievement-uncommon))",
  rare: "hsl(var(--achievement-rare))",
  epic: "hsl(var(--achievement-epic))",
  legendary: "hsl(var(--achievement-legendary))",
  mythic: "hsl(var(--achievement-mythic))",
};

// Initialize tracking for a new user
export async function initializeAchievementTracking(userId: string) {
  const { data: existing } = await supabase
    .from("achievement_tracking")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("achievement_tracking").insert({ user_id: userId });
  }
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

  const updates: any = {};
  
  // Check consecutive login days
  const lastLogin = tracking.last_login_date;
  if (lastLogin === today) {
    return; // Already logged in today
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastLogin === yesterdayStr) {
    updates.consecutive_login_days = (tracking.consecutive_login_days || 0) + 1;
  } else {
    updates.consecutive_login_days = 1;
  }
  
  updates.last_login_date = today;

  // Check same hour login streak
  const hourDiff = tracking.usual_login_hour !== null 
    ? Math.abs(currentHour - tracking.usual_login_hour)
    : null;
  
  if (hourDiff !== null && hourDiff <= 0 && currentMinute <= 15) {
    updates.logins_at_same_hour_streak = (tracking.logins_at_same_hour_streak || 0) + 1;
  } else {
    updates.logins_at_same_hour_streak = 1;
    updates.usual_login_hour = currentHour;
  }

  // Check midnight login
  if (currentHour === 0 && currentMinute <= 5) {
    updates.midnight_logins_count = (tracking.midnight_logins_count || 0) + 1;
  }

  await supabase
    .from("achievement_tracking")
    .update(updates)
    .eq("user_id", userId);

  await checkAchievements(userId);
}

// Track goal creation
export async function trackGoalCreated(userId: string, difficulty: string) {
  const difficultyField = `${difficulty.toLowerCase()}_goals_created`;
  
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId,
    p_field: 'total_goals_created',
    p_increment: 1
  }).then(() => {
    return supabase.rpc('increment_tracking_counter', {
      p_user_id: userId,
      p_field: difficultyField,
      p_increment: 1
    });
  });

  await checkAchievements(userId);
}

// Track goal completion
export async function trackGoalCompleted(
  userId: string, 
  difficulty: string,
  createdAt: string,
  completedAt: string
) {
  const difficultyField = `${difficulty.toLowerCase()}_goals_completed`;
  const created = new Date(createdAt);
  const completed = new Date(completedAt);
  const timeDiff = completed.getTime() - created.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId,
    p_field: 'goals_completed_total',
    p_increment: 1
  }).then(() => {
    return supabase.rpc('increment_tracking_counter', {
      p_user_id: userId,
      p_field: difficultyField,
      p_increment: 1
    });
  });

  // Check time-based achievements
  if (difficulty === 'impossible' && daysDiff < 30) {
    await unlockAchievement(userId, 'cut_through_time');
  }
  if (difficulty === 'extreme' && hoursDiff < 72) {
    await unlockAchievement(userId, 'warping_path');
  }
  if (difficulty === 'extreme' && hoursDiff < 48) {
    await unlockAchievement(userId, 'blood_of_resolve');
  }
  if (hoursDiff < 0.05) { // 3 minutes
    await unlockAchievement(userId, 'echo_breaker');
  }

  await checkAchievements(userId);
}

// Track step completion
export async function trackStepCompleted(userId: string) {
  await supabase.rpc('increment_tracking_counter', {
    p_user_id: userId,
    p_field: 'steps_completed_total',
    p_increment: 1
  });

  await checkAchievements(userId);
}

// Track pact creation
export async function trackPactCreated(userId: string) {
  await supabase
    .from("achievement_tracking")
    .update({ has_pact: true })
    .eq("user_id", userId);

  await unlockAchievement(userId, 'the_sealed_pact');
}

// Track pact edit
export async function trackPactEdited(userId: string) {
  await supabase
    .from("achievement_tracking")
    .update({ has_edited_pact: true })
    .eq("user_id", userId);

  await unlockAchievement(userId, 'keeper_of_the_oath');
}

// Check all achievements
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

    const condition = def.conditions;
    let shouldUnlock = false;

    switch (condition.type) {
      case "consecutive_login_days":
        shouldUnlock = (tracking.consecutive_login_days || 0) >= condition.value;
        break;
      case "logins_at_same_hour_streak":
        shouldUnlock = (tracking.logins_at_same_hour_streak || 0) >= condition.value;
        break;
      case "midnight_logins_count":
        shouldUnlock = (tracking.midnight_logins_count || 0) >= condition.value;
        break;
      case "total_goals_created":
        shouldUnlock = (tracking.total_goals_created || 0) >= condition.value;
        break;
      case "all_difficulties_created":
        shouldUnlock = 
          (tracking.easy_goals_created || 0) > 0 &&
          (tracking.medium_goals_created || 0) > 0 &&
          (tracking.hard_goals_created || 0) > 0 &&
          (tracking.extreme_goals_created || 0) > 0 &&
          (tracking.impossible_goals_created || 0) > 0 &&
          (tracking.custom_goals_created || 0) > 0;
        break;
      case "easy_goals_completed":
      case "medium_goals_completed":
      case "hard_goals_completed":
      case "extreme_goals_completed":
      case "impossible_goals_completed":
      case "custom_goals_completed":
        const field = condition.type as keyof typeof tracking;
        shouldUnlock = ((tracking[field] as number) || 0) >= condition.value;
        break;
      case "goals_completed_total":
        shouldUnlock = (tracking.goals_completed_total || 0) >= condition.value;
        break;
      case "steps_completed_total":
        shouldUnlock = (tracking.steps_completed_total || 0) >= condition.value;
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
    }

    if (shouldUnlock) {
      await unlockAchievement(userId, def.key, def.name, def.rarity);
    }
  }
}

// Unlock an achievement
export async function unlockAchievement(
  userId: string, 
  achievementKey: string,
  achievementName?: string,
  rarity?: AchievementRarity
) {
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_key", achievementKey)
    .maybeSingle();

  if (existing) return;

  await supabase.from("user_achievements").insert({
    user_id: userId,
    achievement_key: achievementKey,
    seen: false,
  });

  // Show notification
  if (achievementName && rarity) {
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

  const achievementMap = new Map(
    userAchievements?.map(ua => [ua.achievement_key, ua]) || []
  );

  return definitions.map(def => ({
    ...def,
    unlocked: achievementMap.has(def.key),
    unlocked_at: achievementMap.get(def.key)?.unlocked_at,
    progress: achievementMap.get(def.key)?.progress,
  }));
}

// Get achievement statistics
export async function getAchievementStats(userId: string) {
  const achievements = await getUserAchievements(userId);
  const unlocked = achievements.filter(a => a.unlocked);
  
  const byRarity = unlocked.reduce((acc, a) => {
    acc[a.rarity] = (acc[a.rarity] || 0) + 1;
    return acc;
  }, {} as Record<AchievementRarity, number>);

  return {
    total: achievements.length,
    unlocked: unlocked.length,
    percentage: Math.round((unlocked.length / achievements.length) * 100),
    byRarity,
    recent: unlocked
      .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
      .slice(0, 5),
  };
}