/**
 * DecisionLogModal — capture or review a decision (decision journal pattern
 * inspired by Annie Duke / Tetlock).
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, GitBranch, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Decision,
  Reversibility,
  useDecisionMutations,
} from "@/hooks/useDecisions";
import { useLifeAreas } from "@/hooks/useLifeAreas";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Decision | null;
}

export function DecisionLogModal({ open, onClose, initial }: Props) {
  const { create, update } = useDecisionMutations();
  const { areas } = useLifeAreas();

  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [expected, setExpected] = useState("");
  const [confidence, setConfidence] = useState<string>("3");
  const [reversibility, setReversibility] = useState<Reversibility>("reversible");
  const [lifeAreaId, setLifeAreaId] = useState<string>("none");
  const [reviewAt, setReviewAt] = useState<Date | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setContext(initial.context ?? "");
      setHypothesis(initial.hypothesis ?? "");
      setDecisionText(initial.decision_text);
      setExpected(initial.expected_outcome ?? "");
      setConfidence(String(initial.confidence ?? 3));
      setReversibility((initial.reversibility ?? "reversible") as Reversibility);
      setLifeAreaId(initial.life_area_id ?? "none");
      setReviewAt(initial.review_at ? new Date(initial.review_at) : undefined);
    } else {
      setTitle("");
      setContext("");
      setHypothesis("");
      setDecisionText("");
      setExpected("");
      setConfidence("3");
      setReversibility("reversible");
      setLifeAreaId("none");
      // Default review date = today + 30d
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setReviewAt(d);
    }
  }, [open, initial]);

  const submit = async () => {
    if (!title.trim() || !decisionText.trim()) return;
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        context: context.trim() || null,
        hypothesis: hypothesis.trim() || null,
        decision_text: decisionText.trim(),
        expected_outcome: expected.trim() || null,
        confidence: Number(confidence),
        reversibility,
        life_area_id: lifeAreaId === "none" ? null : lifeAreaId,
        review_at: reviewAt ? reviewAt.toISOString().slice(0, 10) : null,
      };
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl p-0 bg-card border-white/10 max-h-[85vh] overflow-hidden isolate flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-white/10">
          <DialogTitle className="flex items-center gap-3 text-base font-orbitron tracking-wider">
            <GitBranch className="h-5 w-5 text-primary" />
            {initial ? "Décision" : "Nouvelle décision"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-rajdhani">
            Capture le raisonnement maintenant pour pouvoir le réviser plus tard.
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quitter mon CDI pour lancer Pacte"
              className="mt-1 bg-background/50 border-white/10"
              maxLength={140}
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Contexte</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ce qui m'amène à devoir trancher…"
              className="mt-1 min-h-[70px] bg-background/50 border-white/10 resize-none"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hypothèse</Label>
            <Textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="Ce que je crois être vrai en ce moment…"
              className="mt-1 min-h-[60px] bg-background/50 border-white/10 resize-none"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Décision</Label>
            <Textarea
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              placeholder="Ce que je décide concrètement…"
              className="mt-1 min-h-[70px] bg-background/50 border-white/10 resize-none"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Résultat attendu</Label>
            <Textarea
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder="Si ça marche, voici à quoi ça ressemble…"
              className="mt-1 min-h-[60px] bg-background/50 border-white/10 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confiance</Label>
              <Select value={confidence} onValueChange={setConfidence}>
                <SelectTrigger className="mt-1 bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — instinct</SelectItem>
                  <SelectItem value="2">2 — faible</SelectItem>
                  <SelectItem value="3">3 — modérée</SelectItem>
                  <SelectItem value="4">4 — forte</SelectItem>
                  <SelectItem value="5">5 — certitude</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Réversibilité</Label>
              <Select value={reversibility} onValueChange={(v) => setReversibility(v as Reversibility)}>
                <SelectTrigger className="mt-1 bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reversible">Réversible</SelectItem>
                  <SelectItem value="hard_to_reverse">Difficile à inverser</SelectItem>
                  <SelectItem value="irreversible">Irréversible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Domaine</Label>
              <Select value={lifeAreaId} onValueChange={setLifeAreaId}>
                <SelectTrigger className="mt-1 bg-background/50 border-white/10">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">À revoir le</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "mt-1 w-full justify-start text-left font-normal bg-background/50 border-white/10",
                      !reviewAt && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2 opacity-60" />
                    {reviewAt ? format(reviewAt, "PPP") : "Choisir…"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reviewAt}
                    onSelect={setReviewAt}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={busy || !title.trim() || !decisionText.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}