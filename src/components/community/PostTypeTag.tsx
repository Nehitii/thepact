import { CommunityPost } from "@/hooks/useCommunity";
import { cn } from "@/lib/utils";

const postTypeConfig: Record<CommunityPost['post_type'], {
  emoji: string;
  label: string;
  className: string;
}> = {
  reflection: {
    emoji: "💡",
    label: "Reflection",
    className: "bg-blue-500/12 text-blue-300 border-blue-500/25"
  },
  progress: {
    emoji: "📈",
    label: "Progress",
    className: "bg-amber-500/12 text-amber-300 border-amber-500/25"
  },
  obstacle: {
    emoji: "⚠️",
    label: "Obstacle",
    className: "bg-rose-500/12 text-rose-300 border-rose-500/25"
  },
  mindset: {
    emoji: "🧠",
    label: "Mindset",
    className: "bg-violet-500/12 text-violet-300 border-violet-500/25"
  },
  help_request: {
    emoji: "🆘",
    label: "Help",
    className: "bg-orange-500/12 text-orange-300 border-orange-500/25"
  },
  encouragement: {
    emoji: "💚",
    label: "Support",
    className: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25"
  }
};

interface PostTypeTagProps {
  type: CommunityPost['post_type'];
}

export function PostTypeTag({ type }: PostTypeTagProps) {
  const config = postTypeConfig[type];

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ds-t-label font-semibold uppercase tracking-wider font-mono border",
      config.className
    )}>
      {config.emoji} {config.label}
    </span>
  );
}
