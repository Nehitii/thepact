import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
      <div className="relative inline-block mb-4">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <Icon className="w-12 h-12 text-primary/50 relative z-10" />
      </div>
      <h3 className="font-orbitron text-lg text-primary/80">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 font-rajdhani max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4" variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
