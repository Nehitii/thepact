import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Loader2,
  User,
  Globe,
  Mail,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  Coins,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

const COUNTRIES = ["us", "uk", "fr", "de", "jp", "cn", "au", "ca", "es", "it", "br", "in", "other"] as const;
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

export function ProfileAccountSettings({ userId, initialData }: { userId: string; initialData: any }) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();

  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // --- STYLES SYSTEM ---
  const styles = useMemo(
    () => ({
      // Cartes avec effet de verre et bordures subtiles
      card: "relative overflow-hidden bg-card/10 backdrop-blur-2xl border-primary/10 hover:border-primary/20 transition-all duration-500 rounded-[2rem] shadow-xl group",
      // Inputs massifs et lisibles
      input:
        "h-14 bg-background/30 border-primary/10 focus:border-primary/40 focus:ring-primary/20 font-rajdhani text-lg transition-all rounded-2xl placeholder:text-muted-foreground/30",
      // Labels techniques style HUD
      label: "text-[10px] font-orbitron uppercase tracking-[0.25em] text-primary/60 mb-2 block px-2",
      // Icônes flottantes dans les inputs
      inputIcon:
        "absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors duration-300",
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
      if (formData.language !== i18n.language) await i18n.changeLanguage(formData.language);
      updateGlobalCurrency(formData.currency);
      await refreshCurrency();
      toast({ title: t("profile.updatedTitle"), description: t("profile.updatedDesc") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* --- SECTION 1: IDENTITÉ & DATA --- */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-2 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="h-10 w-1 bg-gradient-to-b from-primary to-transparent rounded-full shadow-[0_0_15px_rgba(var(--primary),0.6)]" />
          <div>
            <h2 className="text-2xl font-orbitron tracking-widest uppercase italic">
              {t("profile.sections.identity")}
            </h2>
            <p className="text-xs text-muted-foreground font-rajdhani tracking-wide opacity-70">PERSONAL DATA MATRIX</p>
          </div>
        </div>

        <Card className={styles.card}>
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
            <User size={300} />
          </div>

          <CardContent className="p-8 md:p-10 grid md:grid-cols-2 gap-8 md:gap-10 relative z-10">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label className={styles.label}>{t("common.email")}</Label>
              <div className="relative group">
                <Mail className={styles.inputIcon} />
                <Input
                  value={formData.email}
                  disabled
                  className={cn(styles.input, "pl-14 opacity-50 cursor-not-allowed bg-muted/5 border-dashed")}
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label className={styles.label}>{t("profile.displayName")}</Label>
              <div className="relative group">
                <ShieldCheck className={styles.inputIcon} />
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className={cn(styles.input, "pl-14")}
                  placeholder="AGENT ID"
                />
              </div>
            </div>

            {/* --- CALENDRIER REFAIT --- */}
            <div className="space-y-2 md:col-span-2">
              <Label className={styles.label}>{t("profile.birthday")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      styles.input,
                      "w-full justify-between px-6 hover:bg-primary/5 border-dashed border-primary/20 hover:border-solid hover:border-primary/40 group/btn",
                    )}
                  >
                    <span className="flex items-center gap-4">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover/btn:scale-110 transition-transform">
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                      <span className={cn("font-rajdhani text-xl", !formData.birthday && "text-muted-foreground")}>
                        {formData.birthday
                          ? format(formData.birthday, "PPP", { locale: dateLocale })
                          : t("profile.birthdayPlaceholder")}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 opacity-30 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto p-0 border-primary/20 bg-popover/95 backdrop-blur-3xl shadow-[0_20px_60px_-10px_rgba(var(--primary),0.3)] rounded-[2rem] overflow-hidden"
                  align="start"
                  sideOffset={10}
                >
                  {/* Calendar Header Visual */}
                  <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6 border-b border-primary/10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-orbitron uppercase tracking-widest text-primary/80 mb-1">
                        Target Date
                      </p>
                      <p className="text-2xl font-rajdhani font-bold text-foreground tracking-wide">
                        {formData.birthday
                          ? format(formData.birthday, "dd MMMM yyyy", { locale: dateLocale })
                          : "NOT SET"}
                      </p>
                    </div>
                    <CalendarIcon className="h-10 w-10 text-primary/20" />
                  </div>

                  {/* Calendar Grid Container */}
                  <div className="p-6 bg-background/40">
                    <Calendar
                      mode="single"
                      selected={formData.birthday}
                      onSelect={(d) => setFormData({ ...formData, birthday: d })}
                      captionLayout="dropdown-buttons" // Active les dropdowns
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                      className="w-full flex justify-center pointer-events-auto" // Centrage global
                      classNames={{
                        // Grille principale
                        month: "space-y-4 w-full",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex justify-between w-full mb-2",
                        row: "flex w-full mt-2 justify-between",

                        // Cellules
                        head_cell:
                          "text-muted-foreground rounded-md w-10 font-normal text-[0.7rem] font-orbitron uppercase text-center",
                        cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-primary/20 hover:text-primary rounded-xl transition-all font-rajdhani text-base",
                        day_selected:
                          "!bg-primary !text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)] hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-primary/10 text-primary font-bold border border-primary/20",
                        day_outside: "text-muted-foreground opacity-30",
                        day_disabled: "text-muted-foreground opacity-30",
                        day_hidden: "invisible",

                        // Navigation & Caption
                        caption: "flex justify-center pt-1 relative items-center mb-4 w-full",
                        caption_label: "hidden", // CACHE LE TEXTE "Janvier 2024" par défaut pour éviter le doublon
                        caption_dropdowns: "flex justify-center gap-3 w-full", // Flex container pour les dropdowns
                        nav: "space-x-1 flex items-center absolute inset-0 justify-between pointer-events-none", // Navigation flèches
                        nav_button:
                          "h-8 w-8 bg-background/80 hover:bg-primary/20 border border-primary/20 rounded-lg opacity-50 hover:opacity-100 transition-all pointer-events-auto",
                        nav_button_previous: "relative z-10",
                        nav_button_next: "relative z-10",

                        // Styling des Dropdowns natifs injectés par react-day-picker
                        dropdown:
                          "bg-card border border-primary/20 rounded-lg py-1 px-3 text-sm font-rajdhani focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-primary/10 transition-colors shadow-sm",
                        dropdown_month: "flex-1 order-1",
                        dropdown_year: "order-2",
                      }}
                    />
                  </div>

                  {/* Calendar Footer Actions */}
                  <div className="p-4 bg-primary/5 border-t border-primary/10 flex justify-between gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 font-orbitron text-[10px] tracking-widest opacity-50 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setFormData({ ...formData, birthday: undefined })}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" /> RESET
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 font-orbitron text-[10px] tracking-widest bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20"
                      onClick={() => setFormData({ ...formData, birthday: new Date() })}
                    >
                      TODAY
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* --- SECTION 2: LOCALIZATION SYSTEM --- */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="h-10 w-1 bg-gradient-to-b from-primary to-transparent rounded-full shadow-[0_0_15px_rgba(var(--primary),0.6)]" />
          <div>
            <h2 className="text-2xl font-orbitron tracking-widest uppercase italic">
              {t("profile.sections.localization")}
            </h2>
            <p className="text-xs text-muted-foreground font-rajdhani tracking-wide opacity-70">REGIONAL PARAMETERS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              id: "country",
              label: t("profile.country"),
              icon: Globe,
              options: COUNTRIES.map((c) => ({ v: c, l: t(`profile.countries.${c}`) })),
            },
            {
              id: "timezone",
              label: t("profile.timezone"),
              icon: Clock,
              options: TIMEZONES.map((tz) => ({ v: tz, l: tz })),
            },
            {
              id: "language",
              label: t("profile.language"),
              icon: Sparkles,
              options: [
                { v: "en", l: "ENGLISH (US)" },
                { v: "fr", l: "FRANÇAIS (FR)" },
              ],
            },
            {
              id: "currency",
              label: t("profile.currency"),
              icon: Coins,
              options: [
                { v: "eur", l: "EURO (€)" },
                { v: "usd", l: "DOLLAR ($)" },
              ],
            },
          ].map((field) => (
            <Card key={field.id} className={styles.card}>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-1.5 rounded-md bg-primary/5 text-primary/70">
                    <field.icon className="h-4 w-4" />
                  </div>
                  <Label className="text-[10px] font-orbitron uppercase tracking-[0.2em] text-muted-foreground/80">
                    {field.label}
                  </Label>
                </div>
                <Select value={formData[field.id]} onValueChange={(v) => setFormData({ ...formData, [field.id]: v })}>
                  <SelectTrigger className="w-full h-12 bg-background/20 border-primary/10 hover:border-primary/30 text-lg font-rajdhani rounded-xl focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-3xl border-primary/20 rounded-xl shadow-2xl max-h-[300px]">
                    {field.options.map((opt) => (
                      <SelectItem
                        key={opt.v}
                        value={opt.v}
                        className="font-rajdhani text-base py-3 focus:bg-primary/10 cursor-pointer"
                      >
                        {opt.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* --- FLOATING SAVE ACTION --- */}
      <div className="sticky bottom-8 z-50 flex justify-center pt-8 pointer-events-none">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="pointer-events-auto h-16 px-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron text-lg tracking-[0.2em] shadow-[0_10px_40px_rgba(var(--primary),0.4)] border-4 border-background/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
        >
          {isSaving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <ShieldCheck className="mr-3 h-6 w-6" />}
          {isSaving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
