import {
  Lightbulb, TrendingUp, AlertTriangle, Brain, HelpCircle, Heart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CommunityPost } from "@/hooks/useCommunity";
import { cn } from "@/lib/utils";

const postTypeConfig: Record<CommunityPost['post_type'], {
  icon: typeof Lightbulb;
  label: string;
  className: string;
}> = {
  reflection: {
    icon: Lightbulb,
    label: "Reflection",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
  },
  progress: {
    icon: TrendingUp,
    label: "Progress",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
  },
  obstacle: {
    icon: AlertTriangle,
    label: "Obstacle",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
  },
  mindset: {
    icon: Brain,
    label: "Mindset",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
  },
  help_request: {
    icon: HelpCircle,
    label: "Help",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
  },
  encouragement: {
    icon: Heart,
    label: "Encouragement",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
  }
};

interface PostTypeTagProps {
  type: CommunityPost['post_type'];
}

export function PostTypeTag({ type }: PostTypeTagProps) {
  const config = postTypeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs border", config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
