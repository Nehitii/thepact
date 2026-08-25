import { useCallback } from "react";
import { Bouton } from "@/components/profile/console-ui";
import { Sparkles, Save, Loader2, Type, Wand2 } from "lucide-react";
import { DataPanel } from "./settings-ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PactVisual } from "@/components/PactVisual";
import { cn } from "@/lib/utils";

const SYMBOL_OPTIONS = [
  { key: "flame", label: "Flamme" },
  { key: "heart", label: "Cœur" },
  { key: "target", label: "Cible" },
  { key: "sparkles", label: "Éclats" },
  { key: "phoenix", label: "Phénix" },
  { key: "compass", label: "Boussole" },
  { key: "citadel", label: "Citadelle" },
  { key: "vortex", label: "Vortex" },
  { key: "shield", label: "Bouclier" },
];

const FONT_OPTIONS = [
  { key: "orbitron", label: "Orbitron", family: "'Orbitron', sans-serif" },
  { key: "rajdhani", label: "Rajdhani", family: "'Rajdhani', sans-serif" },
  { key: "share-tech-mono", label: "Share Tech", family: "'JetBrains Mono', ui-monospace, monospace" },
  { key: "space-grotesk", label: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
  { key: "inter", label: "Inter", family: "'Inter', sans-serif" },
];

const EFFECT_OPTIONS = [
  { key: "none", label: "Aucun", style: {} },
  { key: "cyan-glow", label: "Halo cyan", style: { textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" } },
  { key: "fire-glow", label: "Halo de feu", style: { textShadow: "0 0 8px rgba(255,106,0,0.7), 0 0 30px rgba(255,60,0,0.25)" } },
  { key: "purple-glow", label: "Halo violet", style: { textShadow: "0 0 8px rgba(168,85,247,0.7), 0 0 30px rgba(168,85,247,0.25)" } },
  { key: "gold-glow", label: "Halo doré", style: { textShadow: "0 0 8px rgba(255,200,0,0.7), 0 0 30px rgba(255,200,0,0.25)" } },
  { key: "glitch", label: "Parasites", style: {} },
];

interface PactIdentityCardProps {
  pactId: string | null;
  pactName: string;
  pactMantra: string;
  pactSymbol: string;
  titleFont: string;
  titleEffect: string;
  onPactNameChange: (value: string) => void;
  onPactMantraChange: (value: string) => void;
  onPactSymbolChange: (value: string) => void;
  onTitleFontChange: (value: string) => void;
  onTitleEffectChange: (value: string) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

const CY_INPUT = [
  "bg-[var(--surface-input)] border border-primary/25 rounded-none",
  "focus:border-primary/70 focus:bg-[var(--surface-input-focus)]",
  "text-primary/80 placeholder:text-primary/15 font-mono text-sm tracking-wide h-11",
  "transition-all duration-200",
].join(" ");

export function PactIdentityCard({
  pactId,
  pactName,
  pactMantra,
  pactSymbol,
  titleFont,
  titleEffect,
  onPactNameChange,
  onPactMantraChange,
  onPactSymbolChange,
  onTitleFontChange,
  onTitleEffectChange,
  onSave,
  isSaving = false,
}: PactIdentityCardProps) {
  const handleSave = useCallback(async () => {
    if (!pactId) {
      toast.error("Aucun pacte", { description: "Termine d’abord la mise en route." });
      return;
    }
    if (!pactName.trim()) {
      toast.error("Il manque le nom", { description: "Un pacte sans nom ne se retrouve pas." });
      return;
    }
    /* `mutateAsync` rejette quand l ecriture echoue. La mutation
       affiche deja son propre message dans `onError` ; sans ce
       rattrapage, le rejet remontait jusqu au `onClick` et finissait
       en promesse non geree. */
    try {
      await onSave();
    } catch {
      /* Deja signale par la mutation. */
    }
  }, [pactId, pactName, onSave]);

  const selectedFontFamily = FONT_OPTIONS.find(f => f.key === titleFont)?.family || "'Orbitron', sans-serif";
  const selectedEffectStyle = EFFECT_OPTIONS.find(e => e.key === titleEffect)?.style || {};

  return (
    <DataPanel
      code="MODULE_02"
      title="Identité du pacte"
      statusText={pactId ? <span className="text-primary/50">relié</span> : <span className="text-destructive">aucun pacte</span>}
      footerLeft={<span>Nom : <b className="text-primary">{pactName || "—"}</b></span>}
      footerRight={<span className="text-primary/40">Symbole : {pactSymbol.toUpperCase()}</span>}
    >
      <div className="py-4 space-y-5">
        {/* Live Preview */}
        <div className="border border-dashed border-primary/25 bg-primary/[0.03] p-4">
          <p className="ds-t-label text-primary/40 font-mono tracking-[0.15em] mb-3">Aperçu</p>
          <div className="flex items-center gap-4">
            <PactVisual symbol={pactSymbol} size="sm" />
            <div className="min-w-0 flex-1">
              <h4
                className="text-sm text-primary uppercase tracking-wider truncate"
                style={{ fontFamily: selectedFontFamily, ...selectedEffectStyle }}
              >
                {pactName || "Ton projet"}
              </h4>
              <p className="text-xs text-muted-foreground font-rajdhani mt-0.5 line-clamp-2">
                {pactMantra || "Ta raison d’avancer…"}
              </p>
            </div>
          </div>
        </div>

        {/* Project Name */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            {/* `htmlFor` + `id` : les deux champs de cette carte
                s annoncaient « zone d edition, vide ». */}
            <Label htmlFor="pacte-nom" className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Nom du projet</Label>
          </div>
          <Input id="pacte-nom" value={pactName} onChange={(e) => onPactNameChange(e.target.value)} placeholder="ex. Projet Phénix" maxLength={50} className={CY_INPUT} />
          <div className="flex justify-between">
            <p className="ds-t-label text-primary/20 font-mono tracking-wider">Le nom qui porte ta mission.</p>
            <span className="ds-t-label text-primary/20 font-mono">{pactName.length}/50</span>
          </div>
        </div>

        {/* Mantra */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Label htmlFor="pacte-mantra" className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Le pourquoi</Label>
          </div>
          <Textarea id="pacte-mantra" value={pactMantra} onChange={(e) => onPactMantraChange(e.target.value)} placeholder="ex. Devenir la meilleure version de moi-même…" maxLength={200} rows={3} className={cn(CY_INPUT, "h-auto resize-none")} />
          <div className="flex justify-between">
            <p className="ds-t-label text-primary/20 font-mono tracking-wider">La phrase qui te remet en route.</p>
            <span className="ds-t-label text-primary/20 font-mono">{pactMantra.length}/200</span>
          </div>
        </div>

        {/* Pact Symbol */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Label className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Symbole</Label>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {SYMBOL_OPTIONS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => onPactSymbolChange(key)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 border transition-all duration-200 overflow-hidden",
                  pactSymbol === key
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "border-primary/15 bg-primary/[0.02] hover:border-primary/40"
                )}>
                <PactVisual symbol={key} size="sm" />
                <span className="ds-t-label font-mono text-primary/50 tracking-wider uppercase">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Font */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Type className="h-3 w-3 text-primary/40" />
            <Label className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Police du titre</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FONT_OPTIONS.map(({ key, label, family }) => (
              <button
                key={key}
                type="button"
                onClick={() => onTitleFontChange(key)}
                className={cn(
                  "flex items-center gap-3 p-3 border transition-all duration-200 text-left",
                  titleFont === key
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "border-primary/15 bg-primary/[0.02] hover:border-primary/40"
                )}
              >
                <span
                  className="text-base text-primary/80 truncate"
                  style={{ fontFamily: family }}
                >
                  {pactName || "Projet"}
                </span>
                <span className="ds-t-label font-mono text-primary/30 tracking-wider uppercase ml-auto shrink-0">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Effect */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Wand2 className="h-3 w-3 text-primary/40" />
            <Label className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Effet du titre</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EFFECT_OPTIONS.map(({ key, label, style }) => (
              <button
                key={key}
                type="button"
                onClick={() => onTitleEffectChange(key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 border transition-all duration-200",
                  titleEffect === key
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "border-primary/15 bg-primary/[0.02] hover:border-primary/40"
                )}
              >
                <span
                  className="text-sm text-primary/80 font-bold uppercase"
                  style={{ fontFamily: selectedFontFamily, ...style }}
                >
                  Aa
                </span>
                <span className="ds-t-label font-mono text-primary/30 tracking-wider uppercase">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <Bouton role="primaire" onClick={handleSave} disabled={isSaving || !pactId}>
          {isSaving
            ? <><Loader2 className="animate-spin" />Enregistrement…</>
            : <><Save />Enregistrer</>}
        </Bouton>
      </div>
    </DataPanel>
  );
}
