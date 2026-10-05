// Unified rarity design system for the entire Shop
export const rarityConfig = {
  common: {
    accent: "hsl(215 20% 55%)",
    glow: "hsl(215 20% 55% / 0.12)",
    glowStrong: "hsl(215 20% 55% / 0.25)",
    border: "hsl(215 20% 55% / 0.3)",
    bg: "bg-slate-500/5",
    text: "text-slate-400",
    badgeBg: "bg-slate-500/15",
    badgeText: "text-slate-400",
    badgeBorder: "border-slate-500/30",
    animated: false,
  },
  rare: {
    accent: "hsl(212 90% 55%)",
    glow: "hsl(212 90% 55% / 0.12)",
    glowStrong: "hsl(212 90% 55% / 0.3)",
    border: "hsl(212 90% 55% / 0.35)",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
    animated: false,
  },
  epic: {
    accent: "hsl(270 80% 60%)",
    glow: "hsl(270 80% 60% / 0.15)",
    glowStrong: "hsl(270 80% 60% / 0.35)",
    border: "hsl(270 80% 60% / 0.4)",
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/30",
    animated: true,
  },
  legendary: {
    accent: "hsl(45 100% 60%)",
    glow: "hsl(45 100% 60% / 0.15)",
    glowStrong: "hsl(45 100% 60% / 0.4)",
    border: "hsl(45 100% 60% / 0.45)",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/30",
    animated: true,
  },
} as const;

export type RarityKey = keyof typeof rarityConfig;

export function getRarity(rarity: string) {
  return rarityConfig[rarity as RarityKey] || rarityConfig.common;
}
