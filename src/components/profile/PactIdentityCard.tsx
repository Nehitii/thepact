import { useCallback } from "react";
import { Sparkles, Save, Loader2, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PactSettingsCard } from "./PactSettingsCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { PactVisual } from "@/components/PactVisual";

const SYMBOL_OPTIONS = [
  { key: "flame", labelKey: "profile.pact.symbols.flame" },
  { key: "heart", labelKey: "profile.pact.symbols.heart" },
  { key: "target", labelKey: "profile.pact.symbols.target" },
  { key: "sparkles", labelKey: "profile.pact.symbols.sparkles" },
];

interface PactIdentityCardProps {
  pactId: string | null;
  pactName: string;
  pactMantra: string;
  pactSymbol: string;
  pactColor: string;
  onPactNameChange: (value: string) => void;
  onPactMantraChange: (value: string) => void;
  onPactSymbolChange: (value: string) => void;
  onPactColorChange: (value: string) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

export function PactIdentityCard({
  pactId,
  pactName,
  pactMantra,
  pactSymbol,
  pactColor,
  onPactNameChange,
  onPactMantraChange,
  onPactSymbolChange,
  onPactColorChange,
  onSave,
  isSaving = false,
}: PactIdentityCardProps) {
  const { t } = useTranslation();

  const handleSave = useCallback(async () => {
    if (!pactId) {
      toast({
        title: t("profile.pact.identity.noPactTitle"),
        description: t("profile.pact.identity.noPactDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!pactName.trim()) {
      toast({
        title: t("profile.pact.identity.nameRequired"),
        description: t("profile.pact.identity.nameRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    await onSave();
  }, [pactId, pactName, onSave, t]);

  return (
    <PactSettingsCard
      icon={<Sparkles className="h-5 w-5 text-primary" />}
      title={t("profile.pact.identity.title")}
      description={t("profile.pact.identity.description")}
    >
      <div className="space-y-5">
        {/* Live Preview */}
        <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
          <p className="text-[10px] text-muted-foreground font-orbitron uppercase tracking-widest mb-3">
            {t("profile.pact.identity.preview")}
          </p>
          <div className="flex items-center gap-4">
            <PactVisual symbol={pactSymbol} size="sm" />
            <div className="min-w-0 flex-1">
              <h4 className="font-orbitron text-sm text-primary uppercase tracking-wider truncate">
                {pactName || t("profile.pact.identity.previewPlaceholder")}
              </h4>
              <p className="text-xs text-muted-foreground font-rajdhani mt-0.5 line-clamp-2">
                {pactMantra || t("profile.pact.identity.previewMantraPlaceholder")}
              </p>
            </div>
          </div>
        </div>

        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="pact-name" className="text-sm font-medium text-foreground">
            {t("profile.pact.identity.nameLabel")}
          </Label>
          <Input
            id="pact-name"
            value={pactName}
            onChange={(e) => onPactNameChange(e.target.value)}
            placeholder={t("profile.pact.identity.namePlaceholder")}
            maxLength={50}
            className="bg-background/50 border-primary/20 focus:border-primary/50"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {t("profile.pact.identity.nameHint")}
            </p>
            <span className="text-xs text-muted-foreground/60 font-mono">
              {pactName.length}/50
            </span>
          </div>
        </div>

        {/* The "Why" Statement / Mantra */}
        <div className="space-y-2">
          <Label htmlFor="pact-mantra" className="text-sm font-medium text-foreground">
            {t("profile.pact.identity.whyLabel")}
          </Label>
          <Textarea
            id="pact-mantra"
            value={pactMantra}
            onChange={(e) => onPactMantraChange(e.target.value)}
            placeholder={t("profile.pact.identity.whyPlaceholder")}
            maxLength={200}
            rows={3}
            className="bg-background/50 border-primary/20 focus:border-primary/50 resize-none"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {t("profile.pact.identity.whyHint")}
            </p>
            <span className="text-xs text-muted-foreground/60 font-mono">
              {pactMantra.length}/200
            </span>
          </div>
        </div>

        {/* Pact Symbol */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            {t("profile.pact.identity.symbolLabel")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("profile.pact.identity.symbolHint")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SYMBOL_OPTIONS.map(({ key, labelKey }) => (
              <button
                key={key}
                type="button"
                onClick={() => onPactSymbolChange(key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                  pactSymbol === key
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                    : "border-primary/20 bg-background/50 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <PactVisual symbol={key} size="sm" />
                <span className="text-xs font-medium text-muted-foreground">{t(labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pact Color */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-primary/80" />
            {t("profile.pact.identity.colorLabel")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("profile.pact.identity.colorHint")}
          </p>
          <div className="flex items-center gap-3">
            <label
              className="relative w-12 h-12 rounded-lg border border-primary/20 overflow-hidden flex-shrink-0 cursor-pointer group transition-all duration-200 hover:border-primary/40 active:scale-95"
              style={{ backgroundColor: pactColor }}
            >
              <input
                type="color"
                value={pactColor}
                onChange={(e) => onPactColorChange(e.target.value)}
                className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
              />
              <div
                className="absolute inset-0 rounded-lg pointer-events-none transition-all duration-200 group-hover:opacity-80"
                style={{ boxShadow: `inset 0 0 20px ${pactColor}40` }}
              />
              <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
            </label>
            <Input
              type="text"
              value={pactColor}
              onChange={(e) => onPactColorChange(e.target.value)}
              placeholder="#f59e0b"
              maxLength={7}
              className="h-11 flex-1 bg-background/50 border border-primary/20 focus:border-primary/40 font-mono text-sm"
            />
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
                {t("profile.pact.identity.saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("profile.pact.identity.saveButton")}
              </>
            )}
          </Button>
        </div>
      </div>
    </PactSettingsCard>
  );
}
