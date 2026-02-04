import { ProjectTimelineCard } from "./ProjectTimelineCard";
import { CustomDifficultyCard } from "./CustomDifficultyCard";
import { RanksCard } from "./RanksCard";
import { PactIdentityCard } from "./PactIdentityCard";

interface ProfilePactSettingsProps {
  userId: string;
  pactId: string | null;
  // Pact identity fields
  pactName: string;
  pactMantra: string;
  pactSymbol: string;
  onPactNameChange: (value: string) => void;
  onPactMantraChange: (value: string) => void;
  onPactSymbolChange: (value: string) => void;
  onSavePactIdentity: () => Promise<void>;
  isSavingIdentity?: boolean;
  // Timeline fields
  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onProjectEndDateChange: (date: Date | undefined) => void;
  // Custom difficulty fields
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
  return (
    <div className="space-y-6">
      {/* Pact Identity Card - NEW */}
      <PactIdentityCard
        pactId={pactId}
        pactName={pactName}
        pactMantra={pactMantra}
        pactSymbol={pactSymbol}
        onPactNameChange={onPactNameChange}
        onPactMantraChange={onPactMantraChange}
        onPactSymbolChange={onPactSymbolChange}
        onSave={onSavePactIdentity}
        isSaving={isSavingIdentity}
      />

      {/* Project Timeline Card */}
      <ProjectTimelineCard
        pactId={pactId}
        projectStartDate={projectStartDate}
        projectEndDate={projectEndDate}
        onProjectStartDateChange={onProjectStartDateChange}
        onProjectEndDateChange={onProjectEndDateChange}
      />

      {/* Custom Difficulty Card */}
      <CustomDifficultyCard
        userId={userId}
        customDifficultyName={customDifficultyName}
        customDifficultyActive={customDifficultyActive}
        customDifficultyColor={customDifficultyColor}
        onCustomDifficultyNameChange={onCustomDifficultyNameChange}
        onCustomDifficultyActiveChange={onCustomDifficultyActiveChange}
        onCustomDifficultyColorChange={onCustomDifficultyColorChange}
      />

      {/* Ranks Card */}
      <RanksCard userId={userId} />
    </div>
  );
}
