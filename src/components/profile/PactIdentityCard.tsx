import { useState, useCallback } from "react";
import { Sparkles, Save, Loader2 } from "lucide-react";
import { PactSettingsCard } from "./PactSettingsCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

// Common emoji options for pact symbol
const EMOJI_OPTIONS = [
  "🔥", "⚡", "🎯", "💎", "🌟", "🚀", "💪", "🏆", 
  "🌙", "☀️", "🌈", "🦋", "🐉", "🦅", "🐺", "🦁",
  "⚔️", "🛡️", "👑", "🎭", "🎨", "📚", "💡", "🔮",
  "🌊", "🌸", "🍀", "🌿", "🔷", "❤️", "💜", "🖤",
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const handleEmojiSelect = (emoji: string) => {
    onPactSymbolChange(emoji);
    setShowEmojiPicker(false);
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

        {/* Pact Logo / Symbol */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Pact Symbol
          </Label>
          <div className="flex items-center gap-3">
            {/* Current Symbol Display */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex items-center justify-center w-16 h-16 rounded-xl border-2 border-primary/30 bg-background/50 hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 text-3xl"
              aria-label="Select pact symbol"
            >
              {pactSymbol || "🎯"}
            </button>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">
                Click to change symbol
              </p>
              <p className="text-xs text-muted-foreground">
                Choose an emoji that represents your pact's essence.
              </p>
            </div>
          </div>

          {/* Emoji Picker Grid */}
          {showEmojiPicker && (
            <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-card/80 animate-fade-in">
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg text-xl hover:bg-primary/20 transition-colors ${
                      pactSymbol === emoji ? "bg-primary/30 ring-2 ring-primary" : "bg-background/30"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
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
