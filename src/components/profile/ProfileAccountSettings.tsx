import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Loader2,
  User,
  Globe,
  Mail,
  ShieldCheck,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

// --- Types & Constants ---
const TIMEZONES = [
  "UTC",
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
] as const;
const COUNTRIES = ["us", "uk", "fr", "de", "jp", "cn", "au", "ca", "es", "it", "br", "in", "other"] as const;

interface ProfileAccountSettingsProps {
  userId: string;
  initialData: {
    email: string;
    displayName: string;
    timezone: string;
    language: string;
    currency: string;
    birthday: Date | undefined;
    country: string;
  };
}

// --- Sous-composant pour les lignes du formulaire ---
const SettingRow = ({
  icon: Icon,
  label,
  children,
  description,
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
  description?: string;
}) => (
  <div className="flex flex-col md:flex-row gap-4 py-6 first:pt-0 last:pb-0">
    <div className="md:w-1/3 space-y-1">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Icon size={16} />
        </div>
        <Label className="text-sm font-semibold uppercase tracking-wider font-rajdhani">{label}</Label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground pl-10 leading-relaxed font-rajdhani">{description}</p>
      )}
    </div>
    <div className="md:w-2/3">{children}</div>
  </div>
);

export function ProfileAccountSettings({ userId, initialData }: ProfileAccountSettingsProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();

  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // Styles Glassmorphism arrondis
  const styles = useMemo(
    () => ({
      input:
        "bg-background/40 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-all font-rajdhani rounded-xl",
      selectTrigger:
        "bg-background/40 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all font-rajdhani rounded-xl",
      selectContent: "bg-popover/95 backdrop-blur-xl border-primary/20 shadow-2xl rounded-2xl overflow-hidden",
      card: "bg-card/30 backdrop-blur-md border-primary/10 shadow-lg rounded-3xl overflow-hidden",
    }),
    [],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: formData.displayName.trim() || null,
          timezone: formData.timezone,
          language: formData.language,
          currency: formData.currency,
          birthday: formData.birthday ? format(formData.birthday, "yyyy-MM-dd") : null,
          country: formData.country || null,
        })
        .eq("id", userId);

      if (error) throw error;

      if (formData.language !== i18n.language) {
        await i18n.changeLanguage(formData.language);
      }

      updateGlobalCurrency(formData.currency);
      await refreshCurrency();

      toast({ title: t("profile.updatedTitle"), description: t("profile.updatedDesc") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* SECTION 1: INFORMATIONS PERSONNELLES */}
      <Card className={styles.card}>
        <CardContent className="p-6">
          <h3 className="text-lg font-orbitron text-primary mb-6 flex items-center gap-2">
            {/* CHANGEMENT ICI : Titre plus clair */}
            <User className="h-5 w-5" /> Informations Personnelles
          </h3>

          <div className="divide-y divide-primary/5">
            <SettingRow icon={Mail} label={t("common.email")} description={t("profile.emailCantChange")}>
              <Input value={formData.email} disabled className="opacity-50 cursor-not-allowed bg-muted/20 rounded-xl" />
            </SettingRow>

            <SettingRow icon={ShieldCheck} label={t("profile.displayName")}>
              <Input
                placeholder={t("profile.displayNamePlaceholder")}
                value={formData.displayName}
                onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                className={styles.input}
              />
            </SettingRow>

            <SettingRow icon={CalendarIcon} label={t("profile.birthday")}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left",
                      styles.selectTrigger,
                      !formData.birthday && "text-muted-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {formData.birthday
                        ? format(formData.birthday, "PPP", { locale: dateLocale })
                        : t("profile.birthdayPlaceholder")}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={cn("w-auto p-0", styles.selectContent)} align="start">
                  <Calendar
                    mode="single"
                    selected={formData.birthday}
                    onSelect={(date) => setFormData((p) => ({ ...p, birthday: date }))}
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </SettingRow>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: PRÉFÉRENCES RÉGIONALES */}
      <Card className={styles.card}>
        <CardContent className="p-6">
          <h3 className="text-lg font-orbitron text-primary mb-6 flex items-center gap-2">
            {/* CHANGEMENT ICI : Titre plus clair */}
            <Globe className="h-5 w-5" /> Préférences Régionales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-primary/70">{t("profile.country")}</Label>
              <Select value={formData.country} onValueChange={(val) => setFormData((p) => ({ ...p, country: val }))}>
                <SelectTrigger className={styles.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={styles.selectContent}>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`profile.countries.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase text-primary/70">{t("profile.timezone")}</Label>
              <Select value={formData.timezone} onValueChange={(val) => setFormData((p) => ({ ...p, timezone: val }))}>
                <SelectTrigger className={styles.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={styles.selectContent}>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase text-primary/70">{t("profile.language")}</Label>
              <Select value={formData.language} onValueChange={(val) => setFormData((p) => ({ ...p, language: val }))}>
                <SelectTrigger className={styles.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={styles.selectContent}>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase text-primary/70">{t("profile.currency")}</Label>
              <Select value={formData.currency} onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}>
                <SelectTrigger className={styles.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={styles.selectContent}>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="rounded-xl min-w-[200px] bg-primary hover:bg-primary/80 text-primary-foreground font-orbitron shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:scale-105 active:scale-95"
        >
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          {isSaving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
