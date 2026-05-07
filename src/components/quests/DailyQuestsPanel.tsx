import { useDailyQuests, useGenerateDailyQuests, useClaimQuest } from "@/hooks/useDailyQuests";
import { DSPanel } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BondIcon } from "@/components/ui/bond-icon";
import { Sparkles, Sword } from "lucide-react";

export function DailyQuestsPanel() {
  const { data: quests = [], isLoading } = useDailyQuests();
  const generate = useGenerateDailyQuests();
  const claim = useClaimQuest();

  return (
    <DSPanel className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sword className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider">Quêtes du jour</h3>
        </div>
        {quests.length === 0 && (
          <Button size="sm" variant="outline" onClick={() => generate.mutate()} disabled={generate.isPending}>
            <Sparkles className="h-3 w-3 mr-1" /> Générer
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : quests.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune quête active. Lance la génération pour démarrer la journée.</p>
      ) : (
        <ul className="space-y-2">
          {quests.map((q) => {
            const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.target)) * 100));
            const ready = q.progress >= q.target && q.status !== "claimed";
            return (
              <li key={q.id} className="rounded border border-border/40 bg-background/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{q.title}</p>
                    {q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono">
                    <BondIcon size={12} />
                    {q.reward_bonds}
                  </div>
                </div>
                <Progress value={pct} className="h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{q.progress}/{q.target}</span>
                  {q.status === "claimed" ? (
                    <span className="text-emerald-400">Réclamée</span>
                  ) : ready ? (
                    <Button size="sm" variant="outline" onClick={() => claim.mutate(q.id)} disabled={claim.isPending}>
                      Réclamer
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DSPanel>
  );
}