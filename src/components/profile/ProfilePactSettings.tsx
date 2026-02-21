import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProjectTimelineCard } from "./ProjectTimelineCard";
import { CustomDifficultyCard } from "./CustomDifficultyCard";
import { RanksCard } from "./RanksCard";
import { PactIdentityCard } from "./PactIdentityCard";
import { PactOverviewCard } from "./PactOverviewCard";
import { PactSettingsCard } from "./PactSettingsCard";
import { useResetPact } from "@/hooks/useResetPact";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ProfilePactSettingsProps {
  userId: string;
  pactId: string | null;
  pactName: string;
  pactMantra: string;
  pactSymbol: string;
  pactColor: string;
  onPactNameChange: (value: string) => void;
  onPactMantraChange: (value: string) => void;
  onPactSymbolChange: (value: string) => void;
  onPactColorChange: (value: string) => void;
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
  pactColor,
  onPactNameChange,
  onPactMantraChange,
  onPactSymbolChange,
  onPactColorChange,
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

  const handleReset = async () => {
    if (!pactId) return;
    await resetPact.mutateAsync(pactId);
    setConfirmName("");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
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
        <PactSettingsCard
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          title={t("profile.pact.resetPact")}
          description={t("profile.pact.resetPactDesc")}
        >
          <p className="text-sm text-muted-foreground">
            {t("profile.pact.resetPactWarning")}
          </p>

          <AlertDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setConfirmName(""); }}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                {t("profile.pact.resetPact")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("profile.pact.resetPact")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("profile.pact.resetPactWarning")}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-2 py-2">
                <p className="text-sm text-muted-foreground">
                  {t("profile.pact.resetPactConfirm")}: <strong className="text-foreground">{pactName}</strong>
                </p>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={pactName}
                  autoComplete="off"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={confirmName !== pactName || resetPact.isPending}
                  onClick={handleReset}
                >
                  {resetPact.isPending ? t("profile.pact.resetting") : t("profile.pact.resetPactButton")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PactSettingsCard>
      )}
    </div>
  );
}
