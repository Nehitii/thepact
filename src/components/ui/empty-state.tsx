import { LucideIcon } from "lucide-react";
import { DSEmptyState } from "@/components/ds/DSEmptyState";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * @deprecated — Use `<DSEmptyState>` from `@/components/ds` directly.
 * This is now a thin compatibility shim so existing call sites keep working
 * while the migration to the canonical DS empty state completes in the next pass.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <DSEmptyState
      visual="icon"
      icon={Icon}
      message={title}
      description={description}
      ctaLabel={action?.label}
      onClick={action?.onClick}
      className="flex-1 py-8"
    />
  );
}
