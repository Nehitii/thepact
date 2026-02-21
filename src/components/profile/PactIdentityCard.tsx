import { useCallback } from "react";
import { Sparkles, Save, Loader2 } from "lucide-react";
import { PactSettingsCard } from "./PactSettingsCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { PactVisual } from "@/components/PactVisual";

const SYMBOL_OPTIONS = [
  { key: "flame", label: "Flame" },
  { key: "heart", label: "Heart" },
  { key: "target", label: "Target" },
  { key: "sparkles", label: "Sparkles" },
];

interface PactIdentityCardProps {
  pactId: string | null;
  pactName: string;
  pactMantra: string;
  pactSymbol: string;
  onPactNameChange: (value: string) => void;
  onPactMantraChange: (value: string) => void;
  onPactSymbolChange: (value: string) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

/**
 * Card component for editing pact identity:
 * - Project Name (text input)
 * - The "Why" statement / Mantra (textarea)
 * - Pact Logo/Symbol (emoji picker)
 */
export function PactIdentityCard({
  pactId,
  pactName,
  pactMantra,
  pactSymbol,
  onPactNameChange,
  onPactMantraChange,
  onPactSymbolChange,
  onSave,
  isSaving = false,
}: PactIdentityCardProps) {
  

  const handleSave = useCallback(async () => {
    if (!pactId) {
      toast({
        title: "No Pact Found",
        description: "Please complete onboarding first.",
        variant: "destructive",
      });
      return;
    }

    if (!pactName.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a name for your project.",
        variant: "destructive",
      });
      return;
    }

    await onSave();
  }, [pactId, pactName, onSave]);

  const handleSymbolSelect = (key: string) => {
    onPactSymbolChange(key);
  };

  return (
    <PactSettingsCard
      icon={<Sparkles className="h-5 w-5 text-primary" />}
      title="Pact Identity"
      description="Define your project's name, purpose, and visual symbol"
    >
      <div className="space-y-5">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="pact-name" className="text-sm font-medium text-foreground">
            Project Name
          </Label>
          <Input
            id="pact-name"
            value={pactName}
            onChange={(e) => onPactNameChange(e.target.value)}
            placeholder="e.g., Project Phoenix"
            maxLength={50}
            className="bg-background/50 border-primary/20 focus:border-primary/50"
          />
          <p className="text-xs text-muted-foreground">
            The name that represents your personal project or mission.
          </p>
        </div>

        {/* The "Why" Statement / Mantra */}
        <div className="space-y-2">
          <Label htmlFor="pact-mantra" className="text-sm font-medium text-foreground">
            The &ldquo;Why&rdquo; Statement
          </Label>
          <Textarea
            id="pact-mantra"
            value={pactMantra}
            onChange={(e) => onPactMantraChange(e.target.value)}
            placeholder="e.g., To become the best version of myself and inspire others..."
            maxLength={200}
            rows={3}
            className="bg-background/50 border-primary/20 focus:border-primary/50 resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Your guiding mantra or mission statement. Why does this project matter to you?
          </p>
        </div>

        {/* Pact Symbol */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Pact Symbol
          </Label>
          <p className="text-xs text-muted-foreground">
            Choose an animated symbol for your pact logo.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SYMBOL_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSymbolSelect(key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                  pactSymbol === key
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                    : "border-primary/20 bg-background/50 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <PactVisual symbol={key} size="sm" />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !pactId}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Identity
              </>
            )}
          </Button>
        </div>
      </div>
    </PactSettingsCard>
  );
}
