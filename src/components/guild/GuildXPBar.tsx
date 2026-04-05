import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface Props {
  totalXp: number;
}

function getGuildLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 100));
}

function xpForLevel(level: number) {
  return level * level * 100;
}

const tierColors: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-400",
  diamond: "text-cyan-300",
};

function getTier(level: number) {
  if (level >= 20) return "diamond";
  if (level >= 10) return "gold";
  if (level >= 5) return "silver";
  return "bronze";
}

export function GuildXPBar({ totalXp }: Props) {
  const level = getGuildLevel(totalXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = nextLevelXp > currentLevelXp
    ? ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 100;
  const tier = getTier(level);

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex items-center gap-1 ${tierColors[tier]}`}>
        <Star className="h-4 w-4 fill-current" />
        <span className="text-xs font-black font-orbitron">Lv.{level}</span>
      </div>
      <Progress value={progress} className="flex-1 h-2" />
      <span className="text-[10px] text-muted-foreground font-mono">
        {totalXp}/{nextLevelXp} XP
      </span>
    </div>
  );
}
