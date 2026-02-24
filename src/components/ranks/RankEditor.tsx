import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RankCard } from "./RankCard";
import type { Rank } from "@/types/ranks";
import { 
  Palette, 
  Image as ImageIcon, 
  Quote, 
  Trophy,
  Sparkles,
  X,
  Check,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RankEditorProps {
  rank: Rank;
  open: boolean;
  onClose: () => void;
  onSave: (rank: Rank) => Promise<void>;
  isNew?: boolean;
  globalMaxXP?: number;
}

// Preset color themes
const colorPresets = [
  { name: "Cyan", frame: "#5bb4ff", glow: "rgba(91,180,255,0.5)" },
  { name: "Gold", frame: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
  { name: "Purple", frame: "#a855f7", glow: "rgba(168,85,247,0.5)" },
  { name: "Crimson", frame: "#ef4444", glow: "rgba(239,68,68,0.5)" },
  { name: "Emerald", frame: "#10b981", glow: "rgba(16,185,129,0.5)" },
  { name: "Rose", frame: "#f43f5e", glow: "rgba(244,63,94,0.5)" },
  { name: "Amber", frame: "#fbbf24", glow: "rgba(251,191,36,0.5)" },
  { name: "Indigo", frame: "#6366f1", glow: "rgba(99,102,241,0.5)" },
];

export function RankEditor({ rank, open, onClose, onSave, isNew, globalMaxXP = 0 }: RankEditorProps) {
  const [editedRank, setEditedRank] = useState<Rank>(rank);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basics" | "visuals" | "style">("basics");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setEditedRank(rank);
    setValidationError(null);
  }, [rank]);

  const validateThresholds = (rankToValidate: Rank): string | null => {
    if (globalMaxXP > 0) {
      if (rankToValidate.min_points > globalMaxXP) {
        return `Min XP (${rankToValidate.min_points.toLocaleString()}) exceeds the maximum obtainable XP (${globalMaxXP.toLocaleString()})`;
      }
      if (rankToValidate.max_points && rankToValidate.max_points > globalMaxXP) {
        return `Max XP (${rankToValidate.max_points.toLocaleString()}) exceeds the maximum obtainable XP (${globalMaxXP.toLocaleString()})`;
      }
    }
    if (rankToValidate.max_points && rankToValidate.max_points <= rankToValidate.min_points) {
      return "Max XP must be greater than Min XP";
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateThresholds(editedRank);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setSaving(true);
    try {
      await onSave(editedRank);
      onClose();
    } catch {
      // onSave handles its own error toasts; keep editor open
    } finally {
      setSaving(false);
    }
  };

  const updateRank = (updates: Partial<Rank>) => {
    const newRank = { ...editedRank, ...updates };
    setEditedRank(newRank);
    setValidationError(null);
  };

  const tabs = [
    { id: "basics", label: "Basics", icon: Trophy },
    { id: "visuals", label: "Images", icon: ImageIcon },
    { id: "style", label: "Style", icon: Palette },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-primary/30 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-primary font-orbitron flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {isNew ? "Create New Rank" : "Edit Rank"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Preview */}
            <div className="space-y-4">
              <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">
                Live Preview
              </Label>
              <div className="flex justify-center p-4 bg-background/50 rounded-xl border border-primary/20">
                <RankCard
                  rank={editedRank}
                  currentXP={250}
                  nextRankMinXP={editedRank.min_points + 500}
                  isActive={true}
                  size="md"
                />
              </div>
            </div>

            {/* Right: Editor */}
            <div className="space-y-4">
              <div className="flex gap-1 p-1 bg-primary/5 rounded-lg">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-rajdhani font-medium transition-all",
                      activeTab === tab.id
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-primary/70"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeTab === "basics" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">Rank Name</Label>
                      <Input value={editedRank.name} onChange={(e) => updateRank({ name: e.target.value })} placeholder="e.g. Celestial Architect" maxLength={40} className="bg-card/50 border-primary/30 text-primary font-orbitron" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">Min XP Threshold</Label>
                        <Input type="number" value={editedRank.min_points} onChange={(e) => updateRank({ min_points: parseInt(e.target.value) || 0 })} min={0} max={globalMaxXP > 0 ? globalMaxXP : undefined} className="bg-card/50 border-primary/30 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">Max XP (Optional)</Label>
                        <Input type="number" value={editedRank.max_points || ""} onChange={(e) => updateRank({ max_points: parseInt(e.target.value) || 0 })} min={0} max={globalMaxXP > 0 ? globalMaxXP : undefined} placeholder="Auto" className="bg-card/50 border-primary/30 text-primary" />
                      </div>
                    </div>

                    {globalMaxXP > 0 && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          <span className="text-[10px] font-orbitron text-amber-400 uppercase tracking-wider">
                            Max XP from Goals: {globalMaxXP.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {validationError && (
                      <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-destructive">{validationError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider flex items-center gap-1">
                        <Quote className="h-3 w-3" />
                        Quote / Mantra
                      </Label>
                      <Textarea value={editedRank.quote || ""} onChange={(e) => updateRank({ quote: e.target.value })} placeholder="A philosophical phrase or motivational mantra..." maxLength={120} className="bg-card/50 border-primary/30 text-primary resize-none h-20" />
                    </div>
                  </>
                )}

                {activeTab === "visuals" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">Logo / Icon URL</Label>
                      <Input value={editedRank.logo_url || ""} onChange={(e) => updateRank({ logo_url: e.target.value || null })} placeholder="https://example.com/icon.png" className="bg-card/50 border-primary/30 text-primary text-sm" />
                      <p className="text-[10px] text-muted-foreground">Leave empty to use a default icon</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">Background Image URL</Label>
                      <Input value={editedRank.background_url || ""} onChange={(e) => updateRank({ background_url: e.target.value || null })} placeholder="https://example.com/background.png" className="bg-card/50 border-primary/30 text-primary text-sm" />
                    </div>

                    {editedRank.background_url && (
                      <div className="space-y-2">
                        <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">
                          Background Opacity: {Math.round((editedRank.background_opacity || 0.3) * 100)}%
                        </Label>
                        <Slider value={[(editedRank.background_opacity || 0.3) * 100]} onValueChange={([v]) => updateRank({ background_opacity: v / 100 })} min={5} max={60} step={5} className="py-2" />
                      </div>
                    )}
                  </>
                )}

                {activeTab === "style" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">Color Presets</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => updateRank({ frame_color: preset.frame, glow_color: preset.glow })}
                            className={cn(
                              "p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                              editedRank.frame_color === preset.frame ? "border-primary bg-primary/10" : "border-primary/20 hover:border-primary/40"
                            )}
                          >
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.frame, boxShadow: `0 0 10px ${preset.glow}` }} />
                            <span className="text-[10px] text-muted-foreground">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">Custom Frame Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={editedRank.frame_color || "#5bb4ff"}
                          onChange={(e) => {
                            const color = e.target.value;
                            const rgb = parseInt(color.slice(1), 16);
                            const r = (rgb >> 16) & 255;
                            const g = (rgb >> 8) & 255;
                            const b = rgb & 255;
                            updateRank({ frame_color: color, glow_color: `rgba(${r},${g},${b},0.5)` });
                          }}
                          className="w-12 h-10 rounded cursor-pointer border border-primary/30"
                        />
                        <Input value={editedRank.frame_color || "#5bb4ff"} onChange={(e) => updateRank({ frame_color: e.target.value })} className="flex-1 bg-card/50 border-primary/30 text-primary font-mono text-sm" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-primary/20">
          <Button variant="outline" onClick={onClose} className="flex-1 border-primary/30 text-muted-foreground hover:bg-primary/10">
            <X className="h-4 w-4 mr-2" />Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !editedRank.name.trim()} className="flex-1 bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary font-orbitron">
            <Check className="h-4 w-4 mr-2" />{saving ? "Saving..." : isNew ? "Create Rank" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
