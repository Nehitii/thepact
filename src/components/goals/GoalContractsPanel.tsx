import { useState } from "react";
import { useGoalContracts, useCreateGoalContract, type GoalContract } from "@/hooks/useGoalContracts";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useFriends } from "@/hooks/useFriends";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DSPanel } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BondIcon } from "@/components/ui/bond-icon";
import { toast } from "sonner";
import { Handshake, Check, X, Users } from "lucide-react";

interface Props { goalId: string; goalName: string; }

export function GoalContractsPanel({ goalId, goalName }: Props) {
  const { enabled, isLoading: flagLoading } = useFeatureFlag("goal_contracts");
  const { data: contracts = [], isLoading } = useGoalContracts(goalId);
  const createContract = useCreateGoalContract();
  const { friends } = useFriends();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [stake, setStake] = useState(50);
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWitnesses, setSelectedWitnesses] = useState<string[]>([]);
  const [settling, setSettling] = useState<string | null>(null);

  const friendList = friends || [];

  if (flagLoading) return null;
  if (!enabled) return null;

  const toggleWitness = (id: string) =>
    setSelectedWitnesses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleCreate = async () => {
    if (selectedWitnesses.length === 0) {
      toast.error("Sélectionne au moins un témoin");
      return;
    }
    if (stake <= 0) {
      toast.error("Mise invalide");
      return;
    }
    await createContract.mutateAsync({
      goal_id: goalId,
      witnesses: selectedWitnesses,
      stake_bonds: stake,
      deadline: deadline || null,
      notes,
    });
    setOpen(false);
    setSelectedWitnesses([]);
    setNotes("");
  };

  const handleSettle = async (id: string, outcome: "succeeded" | "failed") => {
    setSettling(id);
    try {
      const { data, error } = await supabase.rpc("settle_contract" as any, {
        _contract_id: id,
        _outcome: outcome,
      });
      if (error) throw error;
      toast.success(outcome === "succeeded" ? "Contrat honoré — Bonds restitués" : "Contrat échoué — Bonds redistribués aux témoins");
      qc.invalidateQueries({ queryKey: ["goal-contracts"] });
      qc.invalidateQueries({ queryKey: ["bond-balance"] });
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setSettling(null);
    }
  };

  const statusBadge = (s: GoalContract["status"]) => {
    const map: Record<string, string> = {
      active: "bg-primary/20 text-primary border-primary/40",
      succeeded: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      failed: "bg-destructive/20 text-destructive border-destructive/40",
      pending: "bg-muted text-muted-foreground",
      canceled: "bg-muted text-muted-foreground",
    };
    return <Badge variant="outline" className={map[s] || ""}>{s}</Badge>;
  };

  return (
    <DSPanel className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider">Contrats sociaux</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Engager un témoin</Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : contracts.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun contrat encore. Engage un témoin pour mettre une mise en jeu.</p>
      ) : (
        <ul className="space-y-2">
          {contracts.map((c) => (
            <li key={c.id} className="rounded border border-border/40 bg-background/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <BondIcon size={14} />
                  <span className="font-mono">{c.stake_bonds}</span>
                  <Users className="h-3 w-3 text-muted-foreground ml-2" />
                  <span className="text-muted-foreground">{c.witnesses.length}</span>
                </div>
                {statusBadge(c.status)}
              </div>
              {c.deadline && (
                <p className="text-xs text-muted-foreground">Échéance : {new Date(c.deadline).toLocaleDateString()}</p>
              )}
              {c.notes && <p className="text-xs">{c.notes}</p>}
              {c.status === "active" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" disabled={settling === c.id} onClick={() => handleSettle(c.id, "succeeded")}>
                    <Check className="h-3 w-3 mr-1" /> Honoré
                  </Button>
                  <Button size="sm" variant="outline" disabled={settling === c.id} onClick={() => handleSettle(c.id, "failed")}>
                    <X className="h-3 w-3 mr-1" /> Échoué
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Engager un contrat — {goalName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Mise (Bonds)</Label>
              <Input type="number" min={1} value={stake} onChange={(e) => setStake(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs">Échéance (optionnel)</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Témoins ({selectedWitnesses.length} sélectionné{selectedWitnesses.length > 1 ? "s" : ""})</Label>
              <div className="max-h-40 overflow-y-auto space-y-1 mt-2 rounded border border-border/40 p-2">
                {friendList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun ami pour le moment.</p>
                ) : (
                  friendList.map((f: any) => {
                    const fid = f.friend_id;
                    const name = f.display_name || "Ami";
                    const checked = selectedWitnesses.includes(fid);
                    return (
                      <button
                        key={fid}
                        type="button"
                        onClick={() => toggleWitness(fid)}
                        className={`w-full flex items-center justify-between text-left text-sm px-2 py-1 rounded ${checked ? "bg-primary/20" : "hover:bg-muted/40"}`}
                      >
                        <span>{name}</span>
                        {checked && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Termes du pacte…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createContract.isPending}>Signer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DSPanel>
  );
}