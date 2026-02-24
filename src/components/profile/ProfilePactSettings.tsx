import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ProjectTimelineCard } from "./ProjectTimelineCard";
import { CustomDifficultyCard } from "./CustomDifficultyCard";
import { RanksCard } from "./RanksCard";
import { PactIdentityCard } from "./PactIdentityCard";
import { PactOverviewCard } from "./PactOverviewCard";
import { DataPanel, SettingsBreadcrumb, CyberSeparator, TerminalLog } from "./settings-ui";
import { useResetPact } from "@/hooks/useResetPact";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  onPactNameChange: (value: string) => void;
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
  onPactNameChange,
  onPactMantraChange,
  onPactSymbolChange,
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

  const [logLines, setLogLines] = useState<{ text: string; type: "ok" | "warn" | "info" }[]>([
    { text: "PACT SETTINGS LOADED", type: "info" },
    { text: "ALL MODULES ACTIVE", type: "ok" },
  ]);

  const handleReset = async () => {
    if (!pactId) return;
    await resetPact.mutateAsync(pactId);
    setConfirmName("");
    setDialogOpen(false);
    setLogLines(prev => [...prev.slice(-3), { text: "⚠ PACT RESET EXECUTED", type: "warn" as const }]);
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
        pactColor={pactColor}
        onPactNameChange={onPactNameChange}
        onPactMantraChange={onPactMantraChange}
        onPactSymbolChange={onPactSymbolChange}
        onPactColorChange={onPactColorChange}
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
