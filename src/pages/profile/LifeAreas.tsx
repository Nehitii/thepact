import { useState } from "react";
import { Compass, Plus, Trash2, GripVertical, Loader2, Sparkles } from "lucide-react";
import { useLifeAreas, type LifeArea } from "@/hooks/useLifeAreas";
import { useUserValues, type UserValue } from "@/hooks/useUserValues";
import { SettingsPageShell, CyberPanel } from "@/components/profile/settings-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const PRESET_AREAS = [
  { name: "Santé", color: "#22c55e", icon: "Heart" },
  { name: "Carrière", color: "#5bb4ff", icon: "Briefcase" },
  { name: "Relations", color: "#ec4899", icon: "Users" },
  { name: "Finance", color: "#f59e0b", icon: "Wallet" },
  { name: "Esprit", color: "#8b5cf6", icon: "Brain" },
  { name: "Loisirs", color: "#06b6d4", icon: "Gamepad2" },
];

export default function LifeAreas() {
  const { areas, isLoading, upsert, remove } = useLifeAreas();
  const { values, isLoading: valuesLoading, upsert: upsertValue, remove: removeValue } = useUserValues();

  const [newArea, setNewArea] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAddArea = async (preset?: typeof PRESET_AREAS[number]) => {
    const name = preset?.name ?? newArea.trim();
    if (!name) return;
    await upsert({
      name,
      color: preset?.color ?? "#5bb4ff",
      icon: preset?.icon ?? "Circle",
      sort_order: areas.length,
      weight: 50,
    });
    if (!preset) setNewArea("");
  };

  const handleAddValue = async () => {
    const label = newValue.trim();
    if (!label) return;
    await upsertValue({ label, rank: values.length });
    setNewValue("");
  };

  return (
    <SettingsPageShell
      icon={<Compass className="h-7 w-7 text-primary" />}
      title="Domaines & Valeurs"
      subtitle="ALIGNMENT CORE"
    >
      {/* ─── Life Areas ───────────────────────────── */}
      <CyberPanel title="Domaines de vie" subtitle="Pivot d'attribution pour Goals, Habits & Finance">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : areas.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-rajdhani">
                Commence par les presets ou crée le tien.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PRESET_AREAS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleAddArea(p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-sm border border-primary/20 bg-card/50 hover:bg-primary/10 hover:border-primary/40 transition-all text-left"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="font-rajdhani text-sm">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {areas.map((a: LifeArea) => (
                <AreaRow key={a.id} area={a} onUpdate={upsert} onDelete={() => remove(a.id)} />
              ))}
            </ul>
          )}

          <div className="flex gap-2 pt-2 border-t border-primary/10">
            <Input
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="Nouveau domaine…"
              onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
            />
            <Button onClick={() => handleAddArea()} variant="hud-primary" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CyberPanel>

      {/* ─── User Values ──────────────────────────── */}
      <CyberPanel title="Tes valeurs" subtitle="Boussole personnelle (3 à 5 recommandées)">
        <div className="space-y-4">
          {valuesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ul className="space-y-2">
              {values.map((v: UserValue, i) => (
                <li
                  key={v.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-sm border border-primary/20 bg-card/50"
                >
                  <Sparkles className="h-4 w-4 text-primary/60" />
                  <span className="font-orbitron text-xs text-primary/60 tabular-nums">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-rajdhani flex-1">{v.label}</span>
                  <button
                    onClick={() => removeValue(v.id)}
                    className="p-1 rounded hover:bg-destructive/20 text-destructive/70 hover:text-destructive"
                    aria-label={`Supprimer ${v.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 pt-2 border-t border-primary/10">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Ex. Liberté, Excellence, Famille…"
              onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
            />
            <Button onClick={handleAddValue} variant="hud-primary" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CyberPanel>
    </SettingsPageShell>
  );
}

function AreaRow({
  area,
  onUpdate,
  onDelete,
}: {
  area: LifeArea;
  onUpdate: (input: Partial<LifeArea> & { name: string }) => Promise<LifeArea>;
  onDelete: () => void;
}) {
  const [weight, setWeight] = useState(area.weight);
  return (
    <li className="group flex items-center gap-3 px-3 py-2 rounded-sm border border-primary/20 bg-card/50 hover:border-primary/40 transition-colors">
      <GripVertical className="h-4 w-4 text-muted-foreground/40" />
      <span
        className="h-3 w-3 rounded-full ring-2 ring-offset-1 ring-offset-background"
        style={{ background: area.color, boxShadow: `0 0 8px ${area.color}` }}
      />
      <span className="font-rajdhani flex-1 truncate">{area.name}</span>
      <div className="hidden md:flex items-center gap-2 w-32">
        <Slider
          value={[weight]}
          min={0}
          max={100}
          step={5}
          onValueChange={(v) => setWeight(v[0])}
          onValueCommit={(v) => onUpdate({ id: area.id, name: area.name, weight: v[0] })}
        />
        <span className="font-orbitron text-[10px] text-primary/60 tabular-nums w-8 text-right">
          {weight}
        </span>
      </div>
      <button
        onClick={onDelete}
        className="p-1 rounded hover:bg-destructive/20 text-destructive/70 hover:text-destructive"
        aria-label={`Supprimer ${area.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}