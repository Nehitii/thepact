import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Edit, Star, Trophy, Pause, Play, Archive, Copy, Trash2, Check, Lock, LockOpen,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  getTagLabel, getTagColor, getStatusBadgeClass, mapToValidTag,
} from "@/lib/goalConstants";
import type { GoalDetailData } from "@/hooks/useGoalDetail";

interface GoalDetailHeroProps {
  goal: GoalDetailData;
  progress: number;
  completedStepsCount: number;
  totalStepsCount: number;
  difficultyColor: string;
  isCompleted: boolean;
  displayTags: string[];
  getDifficultyLabel: (d: string) => string;
  getStatusLabel: (s: string) => string;
  toggleFocus: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onFullyComplete: () => void;
  onPause: () => void;
  onResume: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock?: () => void;
}

export const GoalDetailHero = React.memo(function GoalDetailHero({
  goal, progress, completedStepsCount, totalStepsCount, difficultyColor,
  isCompleted, displayTags, getDifficultyLabel, getStatusLabel,
  toggleFocus, onEdit, onFullyComplete, onPause, onResume, onArchive, onDuplicate, onDelete, onToggleLock,
}: GoalDetailHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <button
          onClick={() => navigate("/goals")}
          className="relative overflow-hidden group flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-sm border border-border text-primary/70 font-rajdhani font-medium tracking-wider transition-all duration-300 hover:border-primary/40 hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Goals</span>
        </button>
      </motion.div>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl p-6"
        style={{
          borderColor: `${difficultyColor}30`,
          boxShadow: `0 0 30px ${difficultyColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        {isCompleted && (
          <div className="absolute top-4 right-4 opacity-25 pointer-events-none rotate-12 z-10">
            <div className="border-2 border-green-400 rounded-lg px-3 py-1 bg-green-400/10">
              <span className="text-green-400 font-bold text-xs font-orbitron tracking-wider">COMPLETED</span>
            </div>
          </div>
        )}

        <div className="relative flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="relative flex-shrink-0">
            {goal.image_url ? (
              <div
                className={`relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 ${isCompleted ? "grayscale" : ""}`}
                style={{ borderColor: `${difficultyColor}60`, boxShadow: `0 0 25px ${difficultyColor}40` }}
              >
                <img src={goal.image_url} alt={goal.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl border-2 flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${difficultyColor}25, hsl(var(--card)))`,
                  borderColor: `${difficultyColor}50`,
                  boxShadow: `0 0 25px ${difficultyColor}40`,
                }}
              >
                <Trophy className="h-10 w-10 md:h-14 md:w-14" style={{ color: difficultyColor, filter: `drop-shadow(0 0 12px ${difficultyColor})` }} />
              </div>
            )}
            <button
              onClick={toggleFocus}
              className="absolute -top-2 -right-2 z-20 p-2 bg-card rounded-full border border-primary/60 hover:scale-110 transition-all duration-200 shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
            >
              <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-primary/70"}`} style={{ filter: goal.is_focus ? "drop-shadow(0 0 6px rgba(250, 204, 21, 0.9))" : "none" }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold font-orbitron tracking-wider bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              {goal.name}
            </h1>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-bold font-rajdhani uppercase tracking-wider" style={{ borderColor: difficultyColor, color: difficultyColor, backgroundColor: `${difficultyColor}15` }}>
                {getDifficultyLabel(goal.difficulty)}
              </Badge>
              {displayTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs capitalize font-rajdhani" style={{ borderColor: `${getTagColor(tag)}60`, color: getTagColor(tag), backgroundColor: `${getTagColor(tag)}15` }}>
                  {getTagLabel(tag, t)}
                </Badge>
              ))}
              <Badge className={`text-xs ${getStatusBadgeClass(goal.status)} font-rajdhani font-bold uppercase`}>
                {getStatusLabel(goal.status)}
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-rajdhani">
                <span className="uppercase tracking-wider text-primary/70">Progress</span>
                <span className="font-bold" style={{ color: difficultyColor }}>
                  {completedStepsCount}/{totalStepsCount} • {progress.toFixed(0)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${difficultyColor}, ${difficultyColor}80)`, boxShadow: `0 0 15px ${difficultyColor}60` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative mt-6 pt-4 border-t border-border flex flex-wrap gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="hud" size="sm" onClick={onEdit} className="rounded-lg"><Edit className="h-4 w-4 mr-1.5" />Edit</Button>
            </TooltipTrigger><TooltipContent>Edit goal details</TooltipContent></Tooltip>

            {!isCompleted && goal.status !== "paused" && goal.status !== "archived" && (
              <Tooltip><TooltipTrigger asChild>
                <Button variant="hud" size="sm" onClick={onFullyComplete} className="rounded-lg text-green-400 border-green-500/30 hover:bg-green-500/10"><Check className="h-4 w-4 mr-1.5" />Complete All</Button>
              </TooltipTrigger><TooltipContent>Mark all steps as complete</TooltipContent></Tooltip>
            )}

            {goal.status !== "fully_completed" && goal.status !== "archived" && (
              goal.status === "paused" ? (
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="hud" size="sm" onClick={onResume} className="rounded-lg"><Play className="h-4 w-4 mr-1.5" />Resume</Button>
                </TooltipTrigger><TooltipContent>Resume this goal</TooltipContent></Tooltip>
              ) : (
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="hud" size="sm" onClick={onPause} className="rounded-lg"><Pause className="h-4 w-4 mr-1.5" />Pause</Button>
                </TooltipTrigger><TooltipContent>Pause this goal</TooltipContent></Tooltip>
              )
            )}

            {goal.status !== "archived" && (
              <Tooltip><TooltipTrigger asChild>
                <Button variant="hud" size="sm" onClick={onArchive} className="rounded-lg"><Archive className="h-4 w-4 mr-1.5" />Archive</Button>
              </TooltipTrigger><TooltipContent>Archive this goal</TooltipContent></Tooltip>
            )}

            <Tooltip><TooltipTrigger asChild>
              <Button variant="hud" size="sm" onClick={onDuplicate} className="rounded-lg"><Copy className="h-4 w-4 mr-1.5" />Duplicate</Button>
            </TooltipTrigger><TooltipContent>Create a copy of this goal</TooltipContent></Tooltip>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="hud" size="sm" className="rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10"><Trash2 className="h-4 w-4 mr-1.5" />Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete the goal and all its steps. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TooltipProvider>
        </div>
      </motion.div>
    </>
  );
});
