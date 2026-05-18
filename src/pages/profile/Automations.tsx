import { useState } from "react";
import { Zap, Loader2, Plus, Trash2, Play, Power } from "lucide-react";
import { useAutomationRules, AutomationRule, AutomationTriggerType, AutomationActionType } from "@/hooks/useAutomationRules";
import { SettingsPageShell, CyberPanel } from "@/components/profile/settings-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  streak_broken: "Série d'habitude cassée",
  goal_overdue: "Goal en retard",
  budget_exceeded: "Budget dépassé",
  low_focus_week: "Semaine pauvre en focus",
  daily_schedule: "Horaire quotidien (UTC)",
};

const ACTION_LABELS: Record<AutomationActionType, string> = {
  send_notification: "Envoyer une notification",
  coach_insight: "Créer un insight coach",
  grant_bonds: "Octroyer des bonds",
};

export default function Automations() {
  const { rules, isLoading, upsert, remove, toggle } = useAutomationRules();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AutomationRule> | null>(null);

  const openCreate = () => {
    setEditing({
      name: "",
      description: "",
      trigger_type: "streak_broken",
      trigger_config: { min_streak_days: 2 },
      action_type: "send_notification",
      action_config: { title: "Reprends ta série !", description: "Tu as cassé une série de plusieurs jours." },
      is_active: true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name) {
      toast({ title: "Nom requis", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync(editing);
      toast({ title: "Règle enregistrée" });
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message ?? String(e), variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <SettingsPageShell title="Automatisations" subtitle="RULE ENGINE" icon={<Zap className="h-7 w-7 text-primary" />}>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell title="Automatisations" subtitle="RULE ENGINE" icon={<Zap className="h-7 w-7 text-primary" />}>
      <CyberPanel title="MES RÈGLES" statusText={<span className="text-muted-foreground">{rules.length} règle(s)</span>}>
        <div className="space-y-3">
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aucune règle. Crée ta première automatisation : « si série cassée → notification ».
            </p>
          )}
          {rules.map((r) => (
            <div key={r.id} className="border border-border/50 bg-card/30 rounded-lg p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-orbitron font-bold text-sm uppercase tracking-wider">{r.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                    {TRIGGER_LABELS[r.trigger_type] ?? r.trigger_type}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent-foreground border border-accent/30">
                    → {ACTION_LABELS[r.action_type] ?? r.action_type}
                  </span>
                </div>
                {r.description && <p className="text-xs text-muted-foreground mt-1.5">{r.description}</p>}
                <div className="flex gap-3 mt-2 text-[10px] font-mono text-muted-foreground/70">
                  <span>Runs : {r.run_count}</span>
                  {r.last_run_at && (
                    <span>Dernier check : {formatDistanceToNow(new Date(r.last_run_at), { addSuffix: true, locale: fr })}</span>
                  )}
                  {r.last_status && <span className="truncate">[{r.last_status}]</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={r.is_active} onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })} />
                <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }} aria-label="Éditer">
                  <Power className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm("Supprimer ?")) remove.mutate(r.id); }} aria-label="Supprimer">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nouvelle règle</Button>
        </div>
      </CyberPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Éditer la règle" : "Nouvelle règle"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input placeholder="Nom de la règle" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <Textarea placeholder="Description (optionnelle)" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-mono uppercase text-muted-foreground">Déclencheur</label>
                  <Select value={editing.trigger_type} onValueChange={(v) => setEditing({ ...editing, trigger_type: v as AutomationTriggerType, trigger_config: {} })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIGGER_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-muted-foreground">Action</label>
                  <Select value={editing.action_type} onValueChange={(v) => setEditing({ ...editing, action_type: v as AutomationActionType, action_config: {} })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTION_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-muted-foreground">Config déclencheur (JSON)</label>
                <Textarea
                  className="font-mono text-xs"
                  rows={3}
                  value={JSON.stringify(editing.trigger_config ?? {}, null, 2)}
                  onChange={(e) => { try { setEditing({ ...editing, trigger_config: JSON.parse(e.target.value) }); } catch { /* ignore */ } }}
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-muted-foreground">Config action (JSON)</label>
                <Textarea
                  className="font-mono text-xs"
                  rows={3}
                  value={JSON.stringify(editing.action_config ?? {}, null, 2)}
                  onChange={(e) => { try { setEditing({ ...editing, action_config: JSON.parse(e.target.value) }); } catch { /* ignore */ } }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <span className="text-xs">Active</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsPageShell>
  );
}