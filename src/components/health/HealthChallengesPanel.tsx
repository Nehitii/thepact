import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { 
  useHealthChallenges, useCreateChallenge, useDeleteChallenge,
  CHALLENGE_TEMPLATES, getRandomChallengeTemplate,
} from "@/hooks/useHealthChallenges";
import { HealthChallengeCard } from "./HealthChallengeCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Sparkles, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import { HUDFrame } from "./HUDFrame";

interface HealthChallengesPanelProps {
  className?: string;
}

function ProgressRing({ progress, size = 32 }: { progress: number; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(progress, 1));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--hud-amber))" strokeWidth="3"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-700" style={{ filter: "drop-shadow(0 0 3px hsl(var(--hud-amber)))" }}
      />
    </svg>
  );
}

export function HealthChallengesPanel({ className }: HealthChallengesPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showNewDialog, setShowNewDialog] = useState(false);
  
  const { data: challenges, isLoading } = useHealthChallenges(user?.id);
  const createChallenge = useCreateChallenge(user?.id);
  const deleteChallenge = useDeleteChallenge(user?.id);
  
  const activeChallenges = challenges?.filter((c) => !c.completed) || [];
  const completedChallenges = challenges?.filter((c) => c.completed) || [];
  
  const handleCreateRandom = () => { createChallenge.mutate(getRandomChallengeTemplate()); setShowNewDialog(false); };
  const handleCreateTemplate = (i: number) => { createChallenge.mutate({ ...CHALLENGE_TEMPLATES[i], target_days: 7 }); setShowNewDialog(false); };
  const handleDelete = (id: string) => { deleteChallenge.mutate(id); };

  return (
    <div className={className}>
      <HUDFrame className="p-0" variant="chart" glowColor="hsl(var(--hud-amber))">
        <div className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Target className="w-5 h-5 text-hud-amber" />
              {t("health.challenges.title")}
            </h3>
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-hud-amber/30 text-hud-amber hover:bg-hud-amber/10 font-mono rounded-lg">
                  <Plus className="w-4 h-4 mr-1" />
                  {t("health.challenges.new")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-hud-amber/20 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-hud-amber" />
                    {t("health.challenges.startNew")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Button onClick={handleCreateRandom} disabled={createChallenge.isPending}
                    className="w-full justify-start gap-3 h-auto py-4 bg-hud-amber/10 border border-hud-amber/30 hover:border-hud-amber/50 font-mono rounded-xl" variant="outline">
                    <Dices className="w-6 h-6 text-hud-amber" />
                    <div className="text-left">
                      <p className="font-semibold">{t("health.challenges.randomChallenge")}</p>
                      <p className="text-xs text-muted-foreground">{t("health.challenges.randomDesc")}</p>
                    </div>
                  </Button>
                  <div className="text-xs text-center text-muted-foreground py-2 font-mono">{t("common.or")}</div>
                  <div className="grid gap-2">
                    {CHALLENGE_TEMPLATES.map((template, index) => (
                      <Button key={template.challenge_type} onClick={() => handleCreateTemplate(index)}
                        disabled={createChallenge.isPending} variant="outline" className="w-full justify-between h-auto py-3 font-mono rounded-xl">
                        <div className="text-left">
                          <p className="font-medium">{template.title}</p>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                        <span className="text-hud-amber text-sm font-bold font-orbitron">+{template.bond_reward}B</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="font-mono text-hud-amber animate-pulse text-lg">_</span>
            </div>
          ) : activeChallenges.length === 0 && completedChallenges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-mono">{t("health.challenges.noChallenges")}</p>
              <p className="text-sm opacity-60 font-mono">{t("health.challenges.startOne")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeChallenges.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{t("health.challenges.active")}</h4>
                  <AnimatePresence>
                    {activeChallenges.map((c) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <ProgressRing progress={c.current_value / c.target_value} />
                        <div className="flex-1"><HealthChallengeCard challenge={c} onDelete={handleDelete} /></div>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              {completedChallenges.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{t("health.challenges.recentlyCompleted")}</h4>
                  <AnimatePresence>{completedChallenges.slice(0, 2).map((c) => <HealthChallengeCard key={c.id} challenge={c} />)}</AnimatePresence>
                </div>
              )}
            </div>
          )}
          <div className="font-mono text-hud-amber/40 text-sm mt-3"><span className="animate-pulse">▌</span></div>
        </div>
      </HUDFrame>
    </div>
  );
}
