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

  const styles = useMemo(
    () => ({
      card: "relative overflow-hidden bg-card/10 backdrop-blur-2xl border-primary/5 hover:border-primary/20 transition-all duration-500 rounded-[2.5rem] shadow-2xl",
      input:
        "h-14 bg-background/20 border-primary/10 focus:border-primary/40 focus:ring-primary/20 font-rajdhani text-lg transition-all rounded-2xl",
      label: "text-[10px] font-orbitron uppercase tracking-[0.3em] text-primary/50 mb-3 block px-2",
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
    <div className="space-y-16">
      {/* --- SECTION IDENTITÉ --- */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="p-3 rounded-2xl bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-orbitron tracking-widest uppercase italic">
              {t("profile.sections.identity")}
            </h2>
            <p className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">
              {t("profile.subtitle")}
            </p>
          </div>
        </div>

        <Card className={styles.card}>
          <CardContent className="p-10 grid md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <Label className={styles.label}>{t("common.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                <Input
                  value={formData.email}
                  disabled
                  className={cn(styles.input, "pl-12 opacity-40 bg-muted/5 border-dashed cursor-not-allowed")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={styles.label}>{t("profile.displayName")}</Label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className={cn(styles.input, "pl-12")}
                  placeholder="ID ENTITY"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className={styles.label}>{t("profile.birthday")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(styles.input, "w-full justify-between px-6 bg-primary/[0.02] hover:bg-primary/5")}
                  >
                    <span className="flex items-center gap-4">
                      <CalendarIcon className="h-5 w-5 text-primary/60" />
                      <span className="font-rajdhani text-xl">
                        {formData.birthday
                          ? format(formData.birthday, "PPP", { locale: dateLocale })
                          : t("profile.birthdayPlaceholder")}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 opacity-20 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-primary/20 bg-popover/95 backdrop-blur-3xl shadow-[0_0_50px_rgba(var(--primary),0.3)] rounded-[2.5rem] overflow-hidden"
                  align="start"
                >
                  <div className="bg-primary/10 p-6 border-b border-primary/10">
                    <p className="text-[10px] font-orbitron uppercase tracking-widest text-primary/60 mb-1 leading-none">
                      Birth Data Recall
                    </p>
                    <p className="text-2xl font-rajdhani font-bold text-primary">
                      {formData.birthday ? format(formData.birthday, "dd MMMM yyyy", { locale: dateLocale }) : "---"}
                    </p>
                  </div>
                  <Calendar
                    mode="single"
                    selected={formData.birthday}
                    onSelect={(d) => setFormData({ ...formData, birthday: d })}
                    captionLayout="dropdown-buttons"
                    fromYear={1940}
                    toYear={new Date().getFullYear()}
                    className="p-6"
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary rounded-xl shadow-lg",
                      day_today: "bg-primary/10 text-primary font-bold rounded-xl",
                      day: "h-12 w-12 font-rajdhani text-base hover:bg-primary/20 transition-all rounded-xl",
                      caption_dropdowns: "flex justify-center gap-2 font-rajdhani w-full",
                    }}
                  />
                  <div className="p-4 bg-primary/5 border-t border-primary/10 flex justify-between px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-orbitron text-[9px] tracking-widest opacity-40 hover:opacity-100"
                      onClick={() => setFormData({ ...formData, birthday: undefined })}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" /> CLEAR
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-orbitron text-[9px] tracking-widest text-primary"
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

      {/* --- SECTION RÉGIONALISATION --- */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="p-3 rounded-2xl bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-orbitron tracking-widest uppercase italic">
            {t("profile.sections.localization")}
          </h2>
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
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <field.icon className="h-3.5 w-3.5 text-primary/40" />
                  <Label className="text-[9px] font-orbitron uppercase tracking-[0.3em] text-muted-foreground/60">
                    {field.label}
                  </Label>
                </div>
                <Select value={formData[field.id]} onValueChange={(v) => setFormData({ ...formData, [field.id]: v })}>
                  <SelectTrigger className="bg-transparent border-none p-0 h-auto text-2xl font-rajdhani focus:ring-0 group transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-3xl border-primary/20 rounded-3xl">
                    {field.options.map((opt) => (
                      <SelectItem key={opt.v} value={opt.v} className="font-rajdhani text-lg py-3">
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

      {/* --- ACTION SAUVEGARDE --- */}
      <div className="sticky bottom-10 z-40 flex justify-center pt-8">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-20 px-20 rounded-[2.5rem] bg-primary text-primary-foreground font-orbitron text-xl tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(var(--primary),0.4)] border-4 border-primary-foreground/10"
        >
          {isSaving ? (
            <Loader2 className="mr-4 h-7 w-7 animate-spin" />
          ) : (
            <ShieldCheck className="mr-4 h-7 w-7 shadow-lg" />
          )}
          {isSaving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
