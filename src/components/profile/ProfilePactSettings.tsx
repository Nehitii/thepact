import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ProjectTimelineCard } from "./ProjectTimelineCard";
import { CustomDifficultyCard } from "./CustomDifficultyCard";
import { RanksCard } from "./RanksCard";
import { PactIdentityCard } from "./PactIdentityCard";
import { PactOverviewCard } from "./PactOverviewCard";
import { DataPanel, SettingsBreadcrumb, CyberSeparator, TerminalLog } from "./settings-ui";
import { useResetPact } from "@/hooks/useResetPact";
import { AlertTriangle, Loader2, Lock, Check, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PactSettingsCard } from "./PactSettingsCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ProfilePactSettingsProps {
  userId: string;
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
  onSavePactIdentity: () => Promise<void>;
  isSavingIdentity?: boolean;
  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onProjectEndDateChange: (date: Date | undefined) => void;
  customDifficultyName: string;
  customDifficultyActive: boolean;
  customDifficultyColor: string;
  onCustomDifficultyNameChange: (value: string) => void;
  onCustomDifficultyActiveChange: (value: boolean) => void;
  onCustomDifficultyColorChange: (value: string) => void;
}

export function ProfilePactSettings({
  userId,
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
  onSavePactIdentity,
  isSavingIdentity,
  projectStartDate,
  projectEndDate,
  onProjectStartDateChange,
  onProjectEndDateChange,
  customDifficultyName,
  customDifficultyActive,
  customDifficultyColor,
  onCustomDifficultyNameChange,
  onCustomDifficultyActiveChange,
  onCustomDifficultyColorChange,
}: ProfilePactSettingsProps) {
  const { t } = useTranslation();
  const resetPact = useResetPact();
  const [confirmName, setConfirmName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { toast } = useToast();

  const [logLines, setLogLines] = useState<{ text: string; type: "ok" | "warn" | "info" }[]>([
    { text: "PACT SETTINGS LOADED", type: "info" },
    { text: "ALL MODULES ACTIVE", type: "ok" },
  ]);

  // Unlock code state
  const [unlockCode, setUnlockCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [existingCodeSet, setExistingCodeSet] = useState(false);

  useEffect(() => {
    const loadCode = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("goal_unlock_code")
        .eq("id", userId)
        .maybeSingle();
      if ((data as any)?.goal_unlock_code) {
        setExistingCodeSet(true);
        setUnlockCode((data as any).goal_unlock_code);
      }
    };
    loadCode();
  }, [userId]);

  const handleSaveUnlockCode = async () => {
    if (unlockCode.length !== 4 || !/^\d{4}$/.test(unlockCode)) {
      toast({ title: "Invalid code", description: "Please enter a 4-digit PIN code", variant: "destructive" });
      return;
    }
    setSavingCode(true);
    const { error } = await supabase
      .from("profiles")
      .update({ goal_unlock_code: unlockCode } as any)
      .eq("id", userId);
    setSavingCode(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setExistingCodeSet(true);
      toast({ title: "Unlock code saved", description: "Your 4-digit goal lock code has been set." });
      setLogLines(prev => [...prev.slice(-3), { text: "UNLOCK CODE UPDATED", type: "ok" as const }]);
    }
  };

  const handleRemoveUnlockCode = async () => {
    setSavingCode(true);
    const { error } = await supabase
      .from("profiles")
      .update({ goal_unlock_code: null } as any)
      .eq("id", userId);
    setSavingCode(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setUnlockCode("");
      setExistingCodeSet(false);
      toast({ title: "Unlock code removed" });
      setLogLines(prev => [...prev.slice(-3), { text: "UNLOCK CODE REMOVED", type: "warn" as const }]);
    }
  };

  const handleReset = async () => {
    if (!pactId) return;
    try {
      await resetPact.mutateAsync(pactId);
      setConfirmName("");
      setDialogOpen(false);
      setLogLines(prev => [...prev.slice(-3), { text: "⚠ PACT RESET EXECUTED", type: "warn" as const }]);
    } catch {
      // Error handled by mutation onError
    }
  };

  return (
    <div className="space-y-4">
      <SettingsBreadcrumb code="PCT.02" />
      <CyberSeparator />

      <PactOverviewCard userId={userId} />

      <PactIdentityCard
        pactId={pactId}
        pactName={pactName}
        pactMantra={pactMantra}
        pactSymbol={pactSymbol}
        titleFont={titleFont}
        titleEffect={titleEffect}
        onPactNameChange={onPactNameChange}
        onPactMantraChange={onPactMantraChange}
        onPactSymbolChange={onPactSymbolChange}
        onTitleFontChange={onTitleFontChange}
        onTitleEffectChange={onTitleEffectChange}
        onSave={onSavePactIdentity}
        isSaving={isSavingIdentity}
      />

      <ProjectTimelineCard
        pactId={pactId}
        projectStartDate={projectStartDate}
        projectEndDate={projectEndDate}
        onProjectStartDateChange={onProjectStartDateChange}
        onProjectEndDateChange={onProjectEndDateChange}
      />

      <CustomDifficultyCard
        userId={userId}
        customDifficultyName={customDifficultyName}
        customDifficultyActive={customDifficultyActive}
        customDifficultyColor={customDifficultyColor}
        onCustomDifficultyNameChange={onCustomDifficultyNameChange}
        onCustomDifficultyActiveChange={onCustomDifficultyActiveChange}
        onCustomDifficultyColorChange={onCustomDifficultyColorChange}
      />

      <RanksCard userId={userId} />

      {/* Goal Lock Code */}
      <PactSettingsCard
        icon={<Lock className="h-4 w-4 text-primary" />}
        title="Goal Lock Code"
        description="Set a 4-digit PIN to lock/unlock sensitive goals"
        sectionId="goal-lock"
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-rajdhani">
            {existingCodeSet
              ? "Your lock code is set. You can change or remove it below."
              : "Set a 4-digit PIN code. Once set, you can lock individual goals to hide their content."}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-[180px]">
              <Input
                type={showCode ? "text" : "password"}
                inputMode="numeric"
                maxLength={4}
                placeholder="0000"
                value={unlockCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setUnlockCode(v);
                }}
                className="font-orbitron tracking-[0.5em] text-center pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              size="sm"
              onClick={handleSaveUnlockCode}
              disabled={savingCode || unlockCode.length !== 4}
              className="gap-1.5"
            >
              {savingCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
          {existingCodeSet && (
            <button
              onClick={handleRemoveUnlockCode}
              disabled={savingCode}
              className="text-[10px] text-destructive/70 hover:text-destructive font-mono uppercase tracking-wider transition-colors"
            >
              [ REMOVE CODE ]
            </button>
          )}
        </div>
      </PactSettingsCard>

      {/* Danger Zone — Reset Pact */}
      {pactId && (
        <DataPanel
          code="MODULE_06"
          title="⚠ DANGER ZONE"
          statusText={<span className="text-destructive">DESTRUCTIVE</span>}
        >
          <div className="py-4 space-y-4">
            <p className="text-[10px] text-destructive/60 font-mono tracking-wider">
              This action is irreversible. All your goals, steps, missions and progress counters will be permanently deleted.
            </p>

            <AlertDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setConfirmName(""); }}>
              <AlertDialogTrigger asChild>
                <button
                  className={cn(
                    "w-full h-10 font-mono text-[10px] tracking-[0.22em] uppercase",
                    "bg-red-950/20 border border-red-500/25",
                    "hover:bg-red-900/25 hover:border-red-400/45",
                    "text-red-400/70 hover:text-red-400",
                    "transition-all duration-200 flex items-center justify-center gap-2",
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  [ RESET PACT ]
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Pact</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is irreversible. All your goals, steps, missions and progress counters will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-2">
                  <p className="text-sm text-muted-foreground">
                    Type your pact name to confirm: <strong className="text-foreground">{pactName}</strong>
                  </p>
                  <Input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={pactName}
                    autoComplete="off"
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <button
                    disabled={confirmName !== pactName || resetPact.isPending}
                    onClick={handleReset}
                    className={cn(
                      "h-10 px-4 font-mono text-[10px] tracking-[0.22em] uppercase",
                      "bg-red-950/40 border border-red-500/40",
                      "text-red-400 hover:bg-red-900/40",
                      "disabled:opacity-30 disabled:cursor-not-allowed",
                      "transition-all duration-200",
                    )}
                  >
                    {resetPact.isPending ? "RESETTING…" : "RESET EVERYTHING"}
                  </button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DataPanel>
      )}

      <TerminalLog lines={logLines} />
      <div className="h-8" />
    </div>
  );
}
