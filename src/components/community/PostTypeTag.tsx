import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Brain, 
  HelpCircle, 
  Heart 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CommunityPost } from "@/hooks/useCommunity";

const postTypeConfig: Record<CommunityPost['post_type'], { icon: typeof Lightbulb; label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  reflection: {
    icon: Lightbulb,
    label: "Reflection",
    variant: 'secondary'
  },
  progress: {
    icon: TrendingUp,
    label: "Progress",
    variant: 'default'
  },
  obstacle: {
    icon: AlertTriangle,
    label: "Obstacle",
    variant: 'outline'
  },
  mindset: {
    icon: Brain,
    label: "Mindset",
    variant: 'secondary'
  },
  help_request: {
    icon: HelpCircle,
    label: "Help",
    variant: 'outline'
  },
  encouragement: {
    icon: Heart,
    label: "Encouragement",
    variant: 'default'
  }
};

interface PostTypeTagProps {
  type: CommunityPost['post_type'];
}

export function PostTypeTag({ type }: PostTypeTagProps) {
  const config = postTypeConfig[type];
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="gap-1 text-xs">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
