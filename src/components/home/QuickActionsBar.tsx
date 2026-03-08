import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsBarProps {
  ownedModules: {
    todo: boolean;
    journal: boolean;
    health: boolean;
  };
  className?: string;
  onNewGoalClick?: () => void;
}

export function QuickActionsBar({ ownedModules, className, onNewGoalClick }: QuickActionsBarProps) {
  const navigate = useNavigate();

  const actions = [
    { id: "new-goal", label: "New Goal", icon: Plus, owned: true, href: "/goals/new", isNew: true },
  ];

  return (
    <div
      className={cn(
        "w-full bg-[var(--nexus-bg)] backdrop-blur-xl border border-[var(--nexus-border)] nexus-shadow",
        className,
      )}
      style={{ borderRadius: "4px" }}
    >
      {/* Permanent top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top-subtle" />

      <div className="flex items-center gap-1 p-1.5 relative">
        {actions.map((action) =>
          action.owned ? (
            <button
              key={action.id}
              onClick={action.isNew ? (onNewGoalClick || (() => navigate(action.href))) : () => navigate(action.href)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 transition-all duration-200",
                "border border-transparent hover:border-[var(--nexus-hover-border)]",
                "hover:bg-[var(--nexus-hover-bg)]",
                "group",
                action.isNew && "border-[var(--nexus-border)] shadow-[0_0_12px_rgba(0,210,255,0.08)]",
              )}
              style={{ borderRadius: "4px" }}
            >
              <action.icon
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  action.isNew ? "text-primary" : "text-[var(--nexus-text-dimmer)] group-hover:text-[var(--nexus-text-label)]",
                )}
                strokeWidth={1.5}
              />
              <span className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[var(--nexus-text-dim)] group-hover:text-[var(--nexus-text-label)] transition-colors">
                {action.label}
              </span>
            </button>
          ) : (
            <div
              key={action.id}
              className="flex items-center gap-2 px-3 py-2 opacity-30 cursor-not-allowed"
              style={{ borderRadius: "4px" }}
            >
              <span className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[var(--nexus-text-dimmer)]">
                {action.label}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
