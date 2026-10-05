/**
 * @deprecated — thin wrapper around <DSPageHeader variant="hud" />.
 * New code should import DSPageHeader from "@/components/ds" instead.
 */
import { ReactNode } from "react";
import { DSPageHeader, type DSPageHeaderBadge } from "@/components/ds/DSPageHeader";

export type ModuleHeaderBadge = DSPageHeaderBadge & { color: string };

interface ModuleHeaderProps {
  systemLabel: string;
  title: string;
  titleAccent: string;
  badges?: ModuleHeaderBadge[];
  children?: ReactNode;
}

export function ModuleHeader({ systemLabel, title, titleAccent, badges = [], children }: ModuleHeaderProps) {
  return (
    <DSPageHeader
      variant="hud"
      systemLabel={systemLabel}
      title={title}
      titleAccent={titleAccent}
      badges={badges}
      actions={children}
    />
  );
}