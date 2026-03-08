import { useCallback } from "react";
import { Sparkles, Save, Loader2, Type, Wand2 } from "lucide-react";
import { DataPanel } from "./settings-ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { PactVisual } from "@/components/PactVisual";
import { cn } from "@/lib/utils";

const SYMBOL_OPTIONS = [
  { key: "flame", label: "Flame" },
  { key: "heart", label: "Heart" },
  { key: "target", label: "Target" },
  { key: "sparkles", label: "Sparkles" },
  { key: "phoenix", label: "Phoenix" },
  { key: "compass", label: "Compass" },
  { key: "citadel", label: "Citadel" },
  { key: "vortex", label: "Vortex" },
  { key: "shield", label: "Shield" },
];

const FONT_OPTIONS = [
  { key: "orbitron", label: "Orbitron", family: "'Orbitron', sans-serif" },
  { key: "rajdhani", label: "Rajdhani", family: "'Rajdhani', sans-serif" },
  { key: "share-tech-mono", label: "Share Tech", family: "'Share Tech Mono', monospace" },
  { key: "space-grotesk", label: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
  { key: "inter", label: "Inter", family: "'Inter', sans-serif" },
];

const EFFECT_OPTIONS = [
  { key: "none", label: "Aucun", style: {} },
  { key: "cyan-glow", label: "Cyan Glow", style: { textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" } },
  { key: "fire-glow", label: "Fire Glow", style: { textShadow: "0 0 8px rgba(255,106,0,0.7), 0 0 30px rgba(255,60,0,0.25)" } },
  { key: "purple-glow", label: "Purple Glow", style: { textShadow: "0 0 8px rgba(168,85,247,0.7), 0 0 30px rgba(168,85,247,0.25)" } },
  { key: "gold-glow", label: "Gold Glow", style: { textShadow: "0 0 8px rgba(255,200,0,0.7), 0 0 30px rgba(255,200,0,0.25)" } },
  { key: "glitch", label: "Glitch", style: {} },
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
      toast({ title: "No Pact Found", description: "Please complete onboarding first.", variant: "destructive" });
      return;
    }
    if (!pactName.trim()) {
      toast({ title: "Project Name Required", description: "Please enter a name for your project.", variant: "destructive" });
      return;
    }
    await onSave();
  }, [pactId, pactName, onSave]);

  const selectedFontFamily = FONT_OPTIONS.find(f => f.key === titleFont)?.family || "'Orbitron', sans-serif";
  const selectedEffectStyle = EFFECT_OPTIONS.find(e => e.key === titleEffect)?.style || {};

  return (
    <DataPanel
      code="MODULE_02"
      title="PACT IDENTITY"
      statusText={pactId ? <span className="text-primary/50">LINKED</span> : <span className="text-destructive">NO PACT</span>}
      footerLeft={<span>NAME: <b className="text-primary">{pactName || "—"}</b></span>}
      footerRight={<span className="text-primary/40">SYMBOL: {pactSymbol.toUpperCase()}</span>}
    >
      <div className="py-4 space-y-5">
        {/* Live Preview */}
        <div className="border border-dashed border-primary/25 bg-primary/[0.03] p-4">
          <p className="text-[9px] text-primary/40 font-mono tracking-[0.15em] mb-3">PREVIEW //</p>
          <div className="flex items-center gap-4">
            <PactVisual symbol={pactSymbol} size="sm" />
            <div className="min-w-0 flex-1">
              <h4
                className="text-sm text-primary uppercase tracking-wider truncate"
                style={{ fontFamily: selectedFontFamily, ...selectedEffectStyle }}
              >
                {pactName || "Your Project"}
              </h4>
              <p className="text-xs text-muted-foreground font-rajdhani mt-0.5 line-clamp-2">
                {pactMantra || "Your mission statement…"}
              </p>
            </div>
          </div>
        </div>

        {/* Project Name */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Project Name</Label>
          </div>
          <Input value={pactName} onChange={(e) => onPactNameChange(e.target.value)} placeholder="e.g., Project Phoenix" maxLength={50} className={CY_INPUT} />
          <div className="flex justify-between">
            <p className="text-[9px] text-primary/20 font-mono tracking-wider">The name that represents your mission.</p>
            <span className="text-[9px] text-primary/20 font-mono">{pactName.length}/50</span>
          </div>
        </div>

        {/* Mantra */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">The "Why" Statement</Label>
          </div>
          <Textarea value={pactMantra} onChange={(e) => onPactMantraChange(e.target.value)} placeholder="e.g., To become the best version of myself…" maxLength={200} rows={3} className={cn(CY_INPUT, "h-auto resize-none")} />
          <div className="flex justify-between">
            <p className="text-[9px] text-primary/20 font-mono tracking-wider">Your guiding mantra.</p>
            <span className="text-[9px] text-primary/20 font-mono">{pactMantra.length}/200</span>
          </div>
        </div>

        {/* Pact Symbol */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Pact Symbol</Label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {SYMBOL_OPTIONS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => onPactSymbolChange(key)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 border transition-all duration-200 overflow-hidden",
                  pactSymbol === key
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "border-primary/15 bg-primary/[0.02] hover:border-primary/40"
                )}>
                <PactVisual symbol={key} size="sm" />
                <span className="text-[9px] font-mono text-primary/50 tracking-wider uppercase">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Font */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Type className="h-3 w-3 text-primary/40" />
            <Label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Title Font</Label>
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
                  {pactName || "Project"}
                </span>
                <span className="text-[8px] font-mono text-primary/30 tracking-wider uppercase ml-auto shrink-0">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Effect */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Wand2 className="h-3 w-3 text-primary/40" />
            <Label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Title Effect</Label>
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
                <span className="text-[8px] font-mono text-primary/30 tracking-wider uppercase">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving || !pactId}
          className={cn(
            "w-full sm:w-auto relative h-10 px-6 font-mono text-[10px] tracking-[0.22em] uppercase",
            "bg-primary/10 border border-primary/35",
            "hover:bg-primary/18 hover:border-primary/65",
            "text-primary shadow-[0_0_14px_hsl(var(--primary)/0.12)]",
            "hover:shadow-[0_0_24px_hsl(var(--primary)/0.28)]",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "transition-all duration-200 flex items-center gap-2",
          )}
        >
          {isSaving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />SAVING…</>) : (<><Save className="h-3.5 w-3.5" />[ SAVE IDENTITY ]</>)}
        </button>
      </div>
    </DataPanel>
  );
}
