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

export function ProfileAccountSettings({ userId, initialData }: { userId: string; initialData: any }) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const styles = useMemo(
    () => ({
      card: "group relative overflow-hidden bg-card/20 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-500 rounded-3xl",
      input:
        "h-12 bg-background/50 border-primary/10 focus:border-primary/40 focus:ring-primary/20 font-rajdhani text-lg",
      label: "text-xs font-orbitron uppercase tracking-[0.2em] text-primary/60 mb-2 block",
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
    <div className="space-y-10">
      {/* SECTION IDENTITÉ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          <h2 className="text-xl font-orbitron tracking-tighter uppercase">{t("profile.sections.identity")}</h2>
        </div>

        <Card className={styles.card}>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <User size={120} />
          </div>
          <CardContent className="p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className={styles.label}>{t("common.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.email} disabled className={cn(styles.input, "pl-11 opacity-60 bg-muted/10")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={styles.label}>{t("profile.displayName")}</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className={cn(styles.input, "pl-11")}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className={styles.label}>{t("profile.birthday")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(styles.input, "w-full justify-between px-4")}>
                    <span className="flex items-center gap-3">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      {formData.birthday
                        ? format(formData.birthday, "PPP", { locale: dateLocale })
                        : t("profile.birthdayPlaceholder")}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-xl border-primary/20">
                  <Calendar
                    mode="single"
                    selected={formData.birthday}
                    onSelect={(d) => setFormData({ ...formData, birthday: d })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION PRÉFÉRENCES RÉGIONALES */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          <h2 className="text-xl font-orbitron tracking-tighter uppercase">{t("profile.sections.localization")}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              id: "country",
              label: t("profile.country"),
              icon: Globe,
              options: COUNTRIES.map((c) => ({ v: c, l: t(`profile.countries.${c}`) })),
            },
            {
              id: "language",
              label: t("profile.language"),
              icon: Sparkles,
              options: [
                { v: "en", l: "English" },
                { v: "fr", l: "Français" },
              ],
            },
          ].map((field) => (
            <Card key={field.id} className={styles.card}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <field.icon className="h-4 w-4 text-primary/70" />
                  <Label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground">
                    {field.label}
                  </Label>
                </div>
                <Select value={formData[field.id]} onValueChange={(v) => setFormData({ ...formData, [field.id]: v })}>
                  <SelectTrigger className="bg-transparent border-none p-0 h-auto text-lg font-rajdhani focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-2xl border-primary/20">
                    {field.options.map((opt) => (
                      <SelectItem key={opt.v} value={opt.v} className="font-rajdhani">
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

      {/* BOUTON SAUVEGARDE FLOTTANT / LARGE */}
      <div className="sticky bottom-8 z-20 flex justify-center pt-10">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-orbitron text-lg tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(var(--primary),0.4)]"
        >
          {isSaving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <ShieldCheck className="mr-3 h-6 w-6" />}
          {isSaving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
