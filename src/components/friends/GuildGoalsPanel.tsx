import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, Plus, Loader2 } from "lucide-react";
import { CyberEmpty } from "@/components/ui/cyber-states";
import { useGuilds, type GuildGoal } from "@/hooks/useGuilds";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  guildId: string;
  canManage: boolean;
}

export function GuildGoalsPanel({ guildId, canManage }: Props) {
  const { t } = useTranslation();
  const { useGuildGoals, createGuildGoal, contributeToGoal } = useGuilds();
  const { data: goals = [], isLoading } = useGuildGoals(guildId);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("100");
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("1");

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createGuildGoal.mutateAsync({
        guildId, title: title.trim(), targetValue: parseInt(targetValue) || 100,
      });
      setTitle(""); setTargetValue("100"); setShowCreate(false);
      toast.success(t("friends.goalCreated"));
    } catch {
      toast.error(t("friends.goalCreateFailed"));
    }
  };

  const handleContribute = async (goalId: string) => {
    const amt = parseInt(contributeAmount) || 1;
    if (amt <= 0) return;
    try {
      await contributeToGoal.mutateAsync({ goalId, amount: amt, guildId });
      setContributeId(null); setContributeAmount("1");
      toast.success(t("friends.contributionAdded"));
    } catch {
      toast.error(t("friends.contributionFailed"));
    }
  };

  return (
    <div className="space-y-3">
      {canManage && (
        <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)} className="text-xs w-full">
          <Plus className="h-3 w-3 mr-1" /> {t("friends.createGoal")}
        </Button>
      )}

      {showCreate && (
        <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-2">
          <Input placeholder={t("friends.goalTitle")} value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" maxLength={100} />
          <div className="flex gap-2">
            <Input type="number" placeholder={t("friends.targetValue")} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="h-8 text-xs w-24" min={1} />
            <Button size="sm" onClick={handleCreate} disabled={!title.trim() || createGuildGoal.isPending} className="text-xs h-8 flex-1">
              {createGuildGoal.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("common.create")}
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="max-h-64">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : goals.length === 0 ? (
          <CyberEmpty icon={Target} title={t("friends.noGoals")} subtitle={t("friends.noGoalsDesc")} />
        ) : (
          <div className="space-y-2">
            {goals.filter((g: GuildGoal) => g.status === "active").map((goal: GuildGoal) => {
              const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
              return (
                <div key={goal.id} className="p-3 rounded-lg border border-border bg-card/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold truncate">{goal.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{goal.current_value}/{goal.target_value}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  {contributeId === goal.id ? (
                    <div className="flex gap-2">
                      <Input type="number" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} className="h-7 text-xs w-20" min={1} />
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleContribute(goal.id)} disabled={contributeToGoal.isPending}>
                        {t("friends.contribute")}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setContributeId(null)}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={() => setContributeId(goal.id)}>
                      <Plus className="h-3 w-3 mr-1" /> {t("friends.contribute")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
