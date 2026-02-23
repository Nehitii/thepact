import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ProjectTimelineCard } from "./ProjectTimelineCard";
import { CustomDifficultyCard } from "./CustomDifficultyCard";
import { RanksCard } from "./RanksCard";
import { PactIdentityCard } from "./PactIdentityCard";
import { PactOverviewCard } from "./PactOverviewCard";
import { PactSettingsCard } from "./PactSettingsCard";
import { useResetPact } from "@/hooks/useResetPact";
import { AlertTriangle, BarChart3, Sparkles, Clock, Zap, Trophy } from "lucide-react";
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
import { cn } from "@/lib/utils";

// ---------- TOC config ----------
const TOC_ITEMS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "identity", label: "Identity", icon: Sparkles },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "difficulty", label: "Difficulty", icon: Zap },
  { id: "ranks", label: "Ranks", icon: Trophy },
  { id: "danger", label: "Reset", icon: AlertTriangle },
] as const;

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
  const [activeSection, setActiveSection] = useState<string>("overview");

  // ---------- Intersection observer for active section ----------
  useEffect(() => {
    const ids = TOC_ITEMS.map((item) => item.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleReset = async () => {
    if (!pactId) return;
    await resetPact.mutateAsync(pactId);
    setConfirmName("");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sticky Table of Contents */}
      <nav className="sticky top-0 z-30 -mx-1 px-1 py-2 bg-background/80 backdrop-blur-md border-b border-primary/10 rounded-lg">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {TOC_ITEMS.map(({ id, label, icon: Icon }) => {
            if (id === "danger" && !pactId) return null;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-rajdhani font-medium whitespace-nowrap transition-all",
                  activeSection === id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

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
          sectionId="danger"
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          title="Reset Pact"
          description="Delete all goals, steps and progress. Your pact identity is kept."
          defaultCollapsed
        >
          <p className="text-sm text-muted-foreground">
            This action is irreversible. All your goals, steps, missions and progress counters will be permanently deleted.
          </p>

          <AlertDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setConfirmName(""); }}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Reset Pact
              </Button>
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
                <Button
                  variant="destructive"
                  disabled={confirmName !== pactName || resetPact.isPending}
                  onClick={handleReset}
                >
                  {resetPact.isPending ? "Resetting…" : "Reset everything"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PactSettingsCard>
      )}
    </div>
  );
}
