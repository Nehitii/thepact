import { useNavigate } from "react-router-dom";
import { CheckSquare, Book, Heart, Plus, Lock } from "lucide-react";
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
    { id: "tasks", label: "Tasks", icon: CheckSquare, owned: ownedModules.todo, href: "/todo" },
    { id: "journal", label: "Journal", icon: Book, owned: ownedModules.journal, href: "/journal" },
    { id: "health", label: "Health", icon: Heart, owned: ownedModules.health, href: "/health" },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2">
        {actions.map((action) =>
          action.owned ? (
            <button
              key={action.id}
              onClick={action.isNew ? (onNewGoalClick || (() => navigate(action.href))) : () => navigate(action.href)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-sm transition-all duration-200",
                "border border-transparent hover:border-[rgba(0,210,255,0.2)]",
                "hover:bg-[rgba(0,180,255,0.04)]",
                "group",
              )}
            >
              <action.icon
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  action.isNew ? "text-primary" : "text-[rgba(160,210,255,0.4)] group-hover:text-[rgba(160,210,255,0.7)]",
                )}
                strokeWidth={1.5}
              />
              <span className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.5)] group-hover:text-[rgba(160,210,255,0.8)] transition-colors">
                {action.label}
              </span>
            </button>
          ) : (
            <div
              key={action.id}
              className="flex items-center gap-2 px-3 py-2 rounded-sm opacity-30 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5 text-[rgba(160,210,255,0.3)]" strokeWidth={1.5} />
              <span className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.3)]">
                {action.label}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
