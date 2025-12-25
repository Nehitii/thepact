import { ProjectTimelineCard } from "./ProjectTimelineCard";
import { CustomDifficultyCard } from "./CustomDifficultyCard";
import { RanksCard } from "./RanksCard";

interface ProfilePactSettingsProps {
  userId: string;
  pactId: string | null;
  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;
  customDifficultyName: string;
  customDifficultyActive: boolean;
  customDifficultyColor: string;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onProjectEndDateChange: (date: Date | undefined) => void;
  onCustomDifficultyNameChange: (value: string) => void;
  onCustomDifficultyActiveChange: (value: boolean) => void;
  onCustomDifficultyColorChange: (value: string) => void;
}

export function ProfilePactSettings({
  userId,
  pactId,
  projectStartDate,
  projectEndDate,
  customDifficultyName,
  customDifficultyActive,
  customDifficultyColor,
  onProjectStartDateChange,
  onProjectEndDateChange,
  onCustomDifficultyNameChange,
  onCustomDifficultyActiveChange,
  onCustomDifficultyColorChange,
}: ProfilePactSettingsProps) {
  return (
    <div className="space-y-6">
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