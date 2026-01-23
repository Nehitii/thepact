import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

interface ProfileAccountSettingsProps {
  userId: string;
  email: string;
  displayName: string;
  timezone: string;
  language: string;
  currency: string;
  birthday: Date | undefined;
  country: string;
  onDisplayNameChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onBirthdayChange: (date: Date | undefined) => void;
  onCountryChange: (value: string) => void;
}

const timezones = [
  { value: "UTC" },
  { value: "Europe/Paris" },
  { value: "Europe/London" },
  { value: "America/New_York" },
  { value: "America/Los_Angeles" },
  { value: "Asia/Tokyo" },
  { value: "Asia/Shanghai" },
  { value: "Australia/Sydney" },
] as const;

const countries = [
  { value: "us" },
  { value: "uk" },
  { value: "fr" },
  { value: "de" },
  { value: "jp" },
  { value: "cn" },
  { value: "au" },
  { value: "ca" },
  { value: "es" },
  { value: "it" },
  { value: "br" },
  { value: "in" },
  { value: "other" },
] as const;

export function ProfileAccountSettings({
  userId,
  email,
  displayName,
  timezone,
  language,
  currency,
  birthday,
  country,
  onDisplayNameChange,
  onTimezoneChange,
  onLanguageChange,
  onCurrencyChange,
  onBirthdayChange,
  onCountryChange,
}: ProfileAccountSettingsProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();
  const [saving, setSaving] = useState(false);

  const persistLanguage = async (nextLanguage: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ language: nextLanguage })
      .eq("id", userId);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[i18n] Failed to persist language", error);
    }
  };

  const handleLanguageChange = async (next: string) => {
    onLanguageChange(next);
    await i18n.changeLanguage(next);
    await persistLanguage(next);
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        timezone,
        language,
        currency,
        birthday: birthday ? birthday.toISOString().split('T')[0] : null,
        country: country || null,
      })
      .eq("id", userId);

    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      updateGlobalCurrency(currency);
      await refreshCurrency();
      toast({
        title: t("profile.updatedTitle"),
        description: t("profile.updatedDesc"),
      });
    }

    setSaving(false);
  };

  // Shop-aligned, lighter glass styles (semantic tokens only)
  const labelStyle = "text-primary/80 font-rajdhani uppercase tracking-wide text-sm";
  const inputStyle = "bg-card/60 border-primary/20 text-foreground placeholder:text-muted-foreground font-rajdhani focus-visible:ring-1 focus-visible:ring-primary/30";
  const selectTriggerStyle = "bg-card/60 border-primary/20 text-foreground font-rajdhani hover:border-primary/40 hover:bg-card/70 focus:ring-1 focus:ring-primary/30";
  const selectContentStyle = "bg-popover/95 backdrop-blur-xl border-primary/20";
  const selectItemStyle = "text-foreground font-rajdhani focus:bg-primary/10 focus:text-foreground";

  return (
    <div className="space-y-6">
      {/* Email (disabled) */}
      <div className="space-y-2">
        <Label htmlFor="email" className={labelStyle}>
          {t("common.email")}
        </Label>
        <Input 
          id="email" 
          value={email} 
          disabled 
          className="bg-card/40 border-primary/15 text-muted-foreground font-rajdhani cursor-not-allowed" 
        />
        <p className="text-xs text-muted-foreground font-rajdhani">{t("profile.emailCantChange")}</p>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName" className={labelStyle}>
          {t("profile.displayName")}
        </Label>
        <Input
          id="displayName"
          placeholder={t("profile.displayNamePlaceholder")}
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          maxLength={100}
          className={inputStyle}
        />
      </div>

      {/* Birthday */}
      <div className="space-y-2">
        <Label className={labelStyle}>
          {t("profile.birthday")}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                selectTriggerStyle,
                !birthday && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              {birthday ? (
                  <span className="text-foreground">{format(birthday, "PPP", { locale: dateLocale })}</span>
              ) : (
                  <span className="text-muted-foreground">{t("profile.birthdayPlaceholder")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-auto p-0 z-50", selectContentStyle)} align="start">
            <Calendar
              mode="single"
              selected={birthday}
              onSelect={onBirthdayChange}
              initialFocus
              captionLayout="dropdown-buttons"
              fromYear={1920}
              toYear={new Date().getFullYear()}
              className="pointer-events-auto [&_.rdp-caption_select]:bg-card [&_.rdp-caption_select]:text-foreground [&_.rdp-caption_select]:border-primary/20 [&_.rdp-day]:text-foreground [&_.rdp-day_button:hover]:bg-primary/10 [&_.rdp-day_button.rdp-day_selected]:bg-primary/20 [&_.rdp-day_button.rdp-day_selected]:text-foreground [&_.rdp-head_cell]:text-primary/80 [&_.rdp-nav_button]:text-primary [&_.rdp-nav_button:hover]:bg-primary/10"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country" className={labelStyle}>
          {t("profile.country")}
        </Label>
        <Select value={country} onValueChange={onCountryChange}>
          <SelectTrigger id="country" className={selectTriggerStyle}>
            <SelectValue placeholder={t("profile.countryPlaceholder")} className="text-[#6b9ec4]" />
          </SelectTrigger>
          <SelectContent className={selectContentStyle}>
            {countries.map((c) => (
              <SelectItem key={c.value} value={c.value} className={selectItemStyle}>
                {t(`profile.countries.${c.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Zone */}
      <div className="space-y-2">
        <Label htmlFor="timezone" className={labelStyle}>
          {t("profile.timezone")}
        </Label>
        <Select value={timezone} onValueChange={onTimezoneChange}>
          <SelectTrigger id="timezone" className={selectTriggerStyle}>
            <SelectValue placeholder={t("profile.timezonePlaceholder")} className="text-[#6b9ec4]" />
          </SelectTrigger>
          <SelectContent className={selectContentStyle}>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value} className={selectItemStyle}>
                {t(`profile.timezones.${tz.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label htmlFor="language" className={labelStyle}>
          {t("profile.language")}
        </Label>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger id="language" className={selectTriggerStyle}>
            <SelectValue placeholder={t("profile.languagePlaceholder")} className="text-[#6b9ec4]" />
          </SelectTrigger>
          <SelectContent className={selectContentStyle}>
            <SelectItem value="en" className={selectItemStyle}>{t("profile.languages.en")}</SelectItem>
            <SelectItem value="fr" className={selectItemStyle}>{t("profile.languages.fr")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label htmlFor="currency" className={labelStyle}>
          {t("profile.currency")}
        </Label>
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger id="currency" className={selectTriggerStyle}>
            <SelectValue placeholder={t("profile.currencyPlaceholder")} className="text-[#6b9ec4]" />
          </SelectTrigger>
          <SelectContent className={selectContentStyle}>
            <SelectItem value="eur" className={selectItemStyle}>{t("profile.currencies.eur")}</SelectItem>
            <SelectItem value="usd" className={selectItemStyle}>{t("profile.currencies.usd")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider transition-all duration-300"
      >
        {saving ? t("common.saving") : t("common.saveChanges")}
      </Button>
    </div>
  );
}
