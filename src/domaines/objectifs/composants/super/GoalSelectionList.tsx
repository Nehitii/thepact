import React, { useState, useMemo, useCallback } from "react";
import { Search, Check, Target, Zap, Crown, X } from "lucide-react";
import { encreSurFond } from "@/domaines/objectifs/logique/encre";
import { Input } from "@/socle/ui/input";
import { Badge } from "@/socle/ui/badge";
import { ScrollArea } from "@/socle/ui/scroll-area";
import { getDifficultyLabel, DIFFICULTY_OPTIONS } from "@/domaines/objectifs/logique/goalConstants";
import { getDifficultyColor } from "@/socle/outils/utils";
import { cn } from "@/socle/outils/utils";
import { useTranslation } from "react-i18next";

interface Goal {
  id: string;
  name: string;
  difficulty?: string | null;
  status?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  tags?: string[];
  completedStepsCount?: number;
  totalStepsCount?: number;
}

interface GoalSelectionListProps {
  goals: Goal[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  excludeIds?: string[];  // Goals that cannot be selected (e.g., super goals, current goal being edited)
  customDifficultyName?: string;
  customDifficultyColor?: string;
}

export function GoalSelectionList({
  goals,
  selectedIds,
  onSelectionChange,
  excludeIds = [],
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
}: GoalSelectionListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);

  /* LES PALIERS OFFERTS SONT CEUX QUI EXISTENT ICI.
   *
   * La liste en proposait quatre, par un « slice(0, 4) » sans motif :
   * « impossible » tombait, et le palier personnalise n etait jamais
   * offert. Sur le pacte de reference, dix objectifs selectionnables
   * sur trente-deux etaient donc hors d atteinte du filtre — sept en
   * palier personnalise, trois en impossible — alors meme que
   * l editeur de regle, lui, les proposait tous les six.
   *
   * Plutot que de corriger le compte, on lit le vivier : un filtre ne
   * propose que des paliers qu au moins un objectif porte. Il ne peut
   * donc ni en oublier, ni en offrir qui ne donneraient rien. */
  const paliersPresents = useMemo(() => {
    const presents = new Set(goals.map((g) => g.difficulty || "easy"));
    const connus = DIFFICULTY_OPTIONS.filter((d) => presents.has(d.value));
    return presents.has("custom")
      ? [...connus, { value: "custom", color: customDifficultyColor }]
      : connus;
  }, [goals, customDifficultyColor]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Filter goals (exclude super goals and excluded IDs)
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      // Exclude super goals from selection
      if (goal.goal_type === "super") return false;
      
      // Exclude specified IDs
      if (excludeIds.includes(goal.id)) return false;

      /* Ce qui est deja membre se lit en tete, en pastilles : le laisser
         aussi dans le vivier reviendrait a le montrer deux fois, et a
         faire chercher parmi des lignes qu on a deja retenues. */
      if (selectedIds.includes(goal.id)) return false;
      
      // Search filter
      if (search && !goal.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Difficulty filter
      if (difficultyFilter && goal.difficulty !== difficultyFilter) {
        return false;
      }
      
      // Tag filter
      if (tagFilter) {
        const goalTags = goal.tags || [];
        if (!goalTags.includes(tagFilter)) return false;
      }
      
      return true;
    });
  }, [goals, search, difficultyFilter, tagFilter, excludeIds, selectedIds]);

  /* LE GROUPE SE LIT AVANT LE VIVIER.
   *
   * Les membres choisis etaient disperses parmi tous les objectifs :
   * pour savoir ce qu on avait compose, il fallait parcourir la liste
   * entiere et repérer les pastilles allumees. A trente-deux objectifs
   * c etait deja penible ; a cent, impossible.
   *
   * Ils remontent donc en tete, en pastilles retirables — toujours
   * visibles, meme pendant qu on cherche ou qu on filtre le vivier, ce
   * qu un simple tri « selectionnes d abord » n aurait pas donne. On
   * garde l ordre de selection : c est celui dans lequel on a compose.
   */
  const membres = useMemo(
    () => selectedIds.map((id) => goals.find((g) => g.id === id)).filter(Boolean) as Goal[],
    [selectedIds, goals],
  );

  const toggleGoal = useCallback((goalId: string) => {
    if (selectedIds.includes(goalId)) {
      onSelectionChange(selectedIds.filter((id) => id !== goalId));
    } else {
      onSelectionChange([...selectedIds, goalId]);
    }
  }, [selectedIds, onSelectionChange]);

  const selectAll = () => {
    const allIds = filteredGoals.map((g) => g.id);
    const newSelection = [...new Set([...selectedIds, ...allIds])];
    onSelectionChange(newSelection);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Le groupe, en tete */}
      {membres.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Crown className="h-3.5 w-3.5" />
            <span>Membres</span>
            <span className="ml-auto tabular-nums">{membres.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {membres.map((membre) => {
              const teinte = getDifficultyColor(membre.difficulty || "easy", customDifficultyColor);
              return (
                <button
                  key={membre.id}
                  type="button"
                  onClick={() => toggleGoal(membre.id)}
                  title={`Retirer « ${membre.name} » du groupe`}
                  /* La pastille porte son propre fond, et son encre se
                     calcule sur ce fond — pas sur celui de la page.
                     Ecrite en teinte de palier sur un fond translucide,
                     elle tombait a 1,49:1 en theme clair : le vert et le
                     jaune des paliers sont taillés pour un fond sombre.
                     Le meme parti que les pastilles de l atelier. */
                  className="group inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: teinte, color: encreSurFond(teinte) }}
                >
                  <span className="truncate">{membre.name}</span>
                  <X className="h-3 w-3 flex-shrink-0 opacity-55 transition-opacity group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
            variant="light"
          />
        </div>
        
        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          {/* Difficulty filters */}
          <div className="flex gap-1.5">
            {paliersPresents.map((diff) => (
              <button
                key={diff.value}
                type="button"
                onClick={() => setDifficultyFilter(difficultyFilter === diff.value ? null : diff.value)}
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-medium transition-all",
                  difficultyFilter === diff.value
                    ? "text-white shadow-lg"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                style={difficultyFilter === diff.value ? { background: diff.color } : {}}
              >
                {diff.value === "custom"
                  ? customDifficultyName || getDifficultyLabel("custom", t)
                  : getDifficultyLabel(diff.value, t)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selection count and actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {filteredGoals.length} à ajouter
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Select All
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Goals list */}
      <ScrollArea className="h-[280px] rounded-xl border border-border bg-card/50 p-2">
        {filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <Target className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No goals found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGoals.map((goal) => {
              const isSelected = selectedIds.includes(goal.id);
              const diffColor = getDifficultyColor(goal.difficulty || "easy", customDifficultyColor);
              const isHabit = goal.goal_type === "habit";
              const progress = goal.totalStepsCount && goal.totalStepsCount > 0
                ? Math.round((goal.completedStepsCount || 0) / goal.totalStepsCount * 100)
                : 0;

              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={cn(
                    "w-full p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                      : "border-border bg-card/80 hover:border-primary/40 hover:bg-card"
                  )}
                >
                  {/* Selection indicator */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>

                  {/* Goal info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isHabit ? (
                        <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      ) : (
                        <Target className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate text-foreground">
                        {goal.name}
                      </span>
                    </div>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="ds-t-label px-1.5 py-0"
                        style={{
                          borderColor: diffColor,
                          color: diffColor,
                        }}
                      >
                        {getDifficultyLabel(goal.difficulty || "easy", t, customDifficultyName)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Selected chips preview */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
          {selectedIds.slice(0, 5).map((id) => {
            const goal = goals.find((g) => g.id === id);
            if (!goal) return null;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="text-xs gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleGoal(id)}
              >
                {goal.name.substring(0, 15)}
                {goal.name.length > 15 ? "..." : ""}
                <span className="text-muted-foreground">×</span>
              </Badge>
            );
          })}
          {selectedIds.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{selectedIds.length - 5} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
