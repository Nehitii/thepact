/**
 * Health challenges panel component.
 * Displays active challenges and allows creating new ones.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { 
  useHealthChallenges, 
  useCreateChallenge, 
  useDeleteChallenge,
  CHALLENGE_TEMPLATES,
  getRandomChallengeTemplate,
} from "@/hooks/useHealthChallenges";
import { HealthChallengeCard } from "./HealthChallengeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Target, Plus, Sparkles, Dices } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthChallengesPanelProps {
  className?: string;
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
  
  const handleCreateRandom = () => {
    const template = getRandomChallengeTemplate();
    createChallenge.mutate(template);
    setShowNewDialog(false);
  };
  
  const handleCreateTemplate = (templateIndex: number) => {
    const template = CHALLENGE_TEMPLATES[templateIndex];
    createChallenge.mutate({ ...template, target_days: 7 });
    setShowNewDialog(false);
  };
  
  const handleDelete = (id: string) => {
    deleteChallenge.mutate(id);
  };

  return (
    <Card className={cn("bg-card/30 backdrop-blur-sm border-primary/10", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-amber-400" />
            {t("health.challenges.title")}
          </CardTitle>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("health.challenges.new")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  {t("health.challenges.startNew")}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Random challenge */}
                <Button
                  onClick={handleCreateRandom}
                  disabled={createChallenge.isPending}
                  className="w-full justify-start gap-3 h-auto py-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50"
                  variant="outline"
                >
                  <Dices className="w-6 h-6 text-amber-400" />
                  <div className="text-left">
                    <p className="font-semibold">{t("health.challenges.randomChallenge")}</p>
                    <p className="text-xs text-muted-foreground">{t("health.challenges.randomDesc")}</p>
                  </div>
                </Button>
                
                <div className="text-xs text-center text-muted-foreground py-2">
                  {t("common.or")}
                </div>
                
                {/* Template challenges */}
                <div className="grid gap-2">
                  {CHALLENGE_TEMPLATES.map((template, index) => (
                    <Button
                      key={template.challenge_type}
                      onClick={() => handleCreateTemplate(index)}
                      disabled={createChallenge.isPending}
                      variant="outline"
                      className="w-full justify-between h-auto py-3"
                    >
                      <div className="text-left">
                        <p className="font-medium">{template.title}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <span className="text-amber-500 text-sm font-bold">+{template.bond_reward}B</span>
                    </Button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeChallenges.length === 0 && completedChallenges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t("health.challenges.noChallenges")}</p>
            <p className="text-sm opacity-60">{t("health.challenges.startOne")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active challenges */}
            {activeChallenges.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("health.challenges.active")}
                </h4>
                <AnimatePresence>
                  {activeChallenges.map((challenge) => (
                    <HealthChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
            
            {/* Completed challenges */}
            {completedChallenges.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("health.challenges.recentlyCompleted")}
                </h4>
                <AnimatePresence>
                  {completedChallenges.slice(0, 2).map((challenge) => (
                    <HealthChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
