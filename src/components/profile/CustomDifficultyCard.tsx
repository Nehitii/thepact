import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DataPanel, SettingRow } from "./settings-ui";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Palette, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDifficultyCardProps {
  userId: string;
  customDifficultyName: string;
  customDifficultyActive: boolean;
  customDifficultyColor: string;
  onCustomDifficultyNameChange: (value: string) => void;
  onCustomDifficultyActiveChange: (value: boolean) => void;
  onCustomDifficultyColorChange: (value: string) => void;
}

const CY_INPUT = [
  "bg-[#010608] border border-primary/25 rounded-none",
  "focus:border-primary/70 focus:bg-[#010b10]",
  "text-primary/80 placeholder:text-primary/15 font-mono text-sm tracking-wide h-11",
  "transition-all duration-200",
].join(" ");

const CY_BTN = [
  "relative rounded-none bg-primary/10 border border-primary/35",
  "hover:bg-primary/18 hover:border-primary/65",
  "text-primary font-mono text-[10px] tracking-[0.22em] uppercase",
  "shadow-[0_0_14px_hsl(var(--primary)/0.12)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.28)]",
  "disabled:opacity-30 disabled:cursor-not-allowed",
  "transition-all duration-200 h-10",
].join(" ");

export function CustomDifficultyCard({
  userId,
  customDifficultyName,
  customDifficultyActive,
  customDifficultyColor,
  onCustomDifficultyNameChange,
  onCustomDifficultyActiveChange,
  onCustomDifficultyColorChange,
}: CustomDifficultyCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userId) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        custom_difficulty_name: customDifficultyName.trim() || null,
        custom_difficulty_active: customDifficultyActive,
        custom_difficulty_color: customDifficultyColor,
      })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Custom Difficulty Updated", description: "Your custom difficulty settings have been saved." });
    }
    setSaving(false);
  };

  return (
    <DataPanel
      code="MODULE_04"
      title="CUSTOM DIFFICULTY"
      statusText={<span className={customDifficultyActive ? "text-primary" : "text-muted-foreground"}>{customDifficultyActive ? "ACTIVE" : "INACTIVE"}</span>}
      footerLeft={<span>NAME: <b className="text-primary">{customDifficultyName || "—"}</b></span>}
    >
      <div className="py-4 space-y-4">
        {/* Difficulty Name */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Difficulty Name</label>
          </div>
          <Input placeholder="Enter custom difficulty name" value={customDifficultyName} onChange={(e) => onCustomDifficultyNameChange(e.target.value)} maxLength={50} className={CY_INPUT} />
        </div>

        {/* Difficulty Color */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold flex items-center gap-1.5">
              <Palette className="h-3 w-3 text-primary/60" />Difficulty Color
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative w-12 h-12 border border-primary/20 overflow-hidden flex-shrink-0 cursor-pointer group transition-all duration-200 hover:border-primary/40 active:scale-95" style={{ backgroundColor: customDifficultyColor }}>
              <input type="color" value={customDifficultyColor} onChange={(e) => onCustomDifficultyColorChange(e.target.value)} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0" />
            </label>
            <Input type="text" value={customDifficultyColor} onChange={(e) => onCustomDifficultyColorChange(e.target.value)} placeholder="#a855f7" maxLength={7} className={cn(CY_INPUT, "flex-1")} />
          </div>
        </div>

        {/* Activate Toggle */}
        <SettingRow
          icon={<Zap className="h-4 w-4 text-primary" />}
          label="Activate Custom Difficulty"
          description={customDifficultyActive ? "Available in goal creation" : "Hidden from selectors"}
          checked={customDifficultyActive}
          disabled={false}
          onToggle={onCustomDifficultyActiveChange}
        />

        {/* Preview */}
        {customDifficultyName && (
          <div className="border border-dashed border-primary/25 bg-primary/[0.03] p-3">
            <p className="text-[9px] text-primary/40 font-mono tracking-[0.15em] mb-2">PREVIEW //</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: customDifficultyColor }} />
              <span className="font-orbitron uppercase tracking-wide text-sm font-semibold" style={{ color: customDifficultyColor }}>{customDifficultyName}</span>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className={cn(CY_BTN, "w-full flex items-center justify-center gap-2")}>
          {saving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />SAVING…</>) : "[ SAVE DIFFICULTY ]"}
        </button>
      </div>
    </DataPanel>
  );
}
