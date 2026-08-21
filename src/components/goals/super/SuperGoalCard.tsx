import React, { memo } from "react";
import { SuperGoalGridCard } from "./SuperGoalGridCard";
import { SuperGoalBarCard } from "./SuperGoalBarCard";
import { SuperGoalBookmarkCard } from "./SuperGoalBookmarkCard";
import type { SuperGoalRule } from "./types";

interface SuperGoalCardProps {
  id: string;
  name: string;
  childCount: number;
  completedCount: number;
  /** Le groupe a ete honore — le geste, pas le seuil. */
  honore?: boolean;
  /** Tous les membres sont franchis, le geste reste a faire. */
  pret?: boolean;
  isDynamic: boolean;
  rule?: SuperGoalRule | null;
  difficulty?: string;
  onClick: (id: string) => void;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  displayMode?: "grid" | "bar" | "bookmark";
  imageUrl?: string | null;
}

export const SuperGoalCard = memo(function SuperGoalCard({
  displayMode = "grid",
  ...props
}: SuperGoalCardProps) {
  switch (displayMode) {
    case "bar":
      return <SuperGoalBarCard {...props} />;
    case "bookmark":
      return <SuperGoalBookmarkCard {...props} />;
    case "grid":
    default:
      return <SuperGoalGridCard {...props} />;
  }
});
