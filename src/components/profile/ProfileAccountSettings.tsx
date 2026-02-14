import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Loader2,
  User,
  Globe,
  Mail,
  ShieldCheck,
  Save,
  Clock,
  Coins,
  Languages,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

// Composant visuel pour les Inputs "Tech"
const CyberInputWrapper = ({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  icon: any;
  label: string;
}) => (
  <div className="space-y-2 group">
    <Label className="text-xs uppercase tracking-widest text-muted-foreground font-rajdhani font-semibold flex items-center gap-2 group-focus-within:text-primary transition-colors">
      <Icon size={12} /> {label}
    </Label>
    <div className="relative">
      {children}
      {/* Decorative corner accent */}
      <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-primary/50 opacity-0 group-focus-within:opacity-100 transition-opacity" />
    </div>
  </div>
);

export function ProfileAccountSettings({ userId, initialData }: ProfileAccountSettingsProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();

  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // Styles améliorés pour l'ambiance Cyber
  const styles = {
    card: "bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden relative",
    cardHeader: "bg-white/5 border-b border-white/5 px-6 py-4",
    input:
      "bg-secondary/20 border-white/10 text-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-rajdhani text-base transition-all h-10 placeholder:text-muted-foreground/50",
    selectTrigger: "bg-secondary/20 border-white/10 focus:ring-primary/40 focus:border-primary/60 font-rajdhani h-10",
    selectContent: "bg-[#0a0a0a] border-white/10 text-foreground shadow-[0_0_30px_rgba(0,0,0,0.8)]",
  };

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

      toast({
        title: "SYSTEM UPDATE",
        description: t("profile.updatedDesc"),
        className: "border-primary/50 bg-black/90 text-primary font-orbitron",
      });
    } catch (error: any) {
      toast({ title: "ERROR", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-5xl mx-auto space-y-6 pb-20"
    >
      {/* Header avec action rapide */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            {t("profile.settingsTitle", "Account Matrix")}
          </h2>
          <p className="text-muted-foreground font-rajdhani">
            {t("profile.settingsSubtitle", "Manage your personal identity and regional preferences.")}
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="relative overflow-hidden bg-primary text-primary-foreground font-orbitron tracking-widest hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all group"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          )}
          {isSaving ? "SYNCING..." : "SAVE CHANGES"}
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE 1: IDENTITÉ (Prend 2 colonnes sur large) */}
        <motion.div variants={containerVariants} className="lg:col-span-2">
          <Card className={styles.card}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-transparent" />
            <CardHeader className={styles.cardHeader}>
              <CardTitle className="flex items-center gap-2 font-orbitron text-lg tracking-wider text-primary">
                <User className="h-5 w-5" />
                {t("profile.sections.identity").toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <CyberInputWrapper icon={Mail} label={t("common.email")}>
                  <Input
                    value={formData.email}
                    disabled
                    className={cn(styles.input, "opacity-50 cursor-not-allowed bg-muted/10 border-dashed")}
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-orbitron">
                    LOCKED
                  </span>
                </CyberInputWrapper>

                <CyberInputWrapper icon={ShieldCheck} label={t("profile.displayName")}>
                  <Input
                    placeholder="Enter codename..."
                    value={formData.displayName}
                    onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                    className={styles.input}
                  />
                </CyberInputWrapper>
              </div>

              <Separator className="bg-white/5" />

              <CyberInputWrapper icon={CalendarIcon} label={t("profile.birthday")}>
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
                      <span className="flex items-center gap-2 truncate">
                        {formData.birthday
                          ? format(formData.birthday, "PPP", { locale: dateLocale })
                          : t("profile.birthdayPlaceholder")}
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={cn("w-auto p-0 border-primary/20", styles.selectContent)} align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birthday}
                      onSelect={(date) => setFormData((p) => ({ ...p, birthday: date }))}
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                      initialFocus
                      className="bg-[#0a0a0a] text-foreground"
                    />
                  </PopoverContent>
                </Popover>
              </CyberInputWrapper>
            </CardContent>
          </Card>
        </motion.div>

        {/* COLONNE 2: PRÉFÉRENCES (Verticale) */}
        <motion.div variants={containerVariants} className="lg:col-span-1 h-full">
          <Card className={cn(styles.card, "h-full flex flex-col")}>
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-purple-500/50 to-transparent" />
            <CardHeader className={styles.cardHeader}>
              <CardTitle className="flex items-center gap-2 font-orbitron text-lg tracking-wider text-purple-400">
                <Globe className="h-5 w-5" />
                {t("profile.sections.localization").toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-5 flex-1">
              <CyberInputWrapper icon={MapPin} label={t("profile.country")}>
                <Select value={formData.country} onValueChange={(val) => setFormData((p) => ({ ...p, country: val }))}>
                  <SelectTrigger className={styles.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={styles.selectContent}>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c} className="font-rajdhani focus:bg-primary/20 focus:text-primary">
                        {t(`profile.countries.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CyberInputWrapper>

              <CyberInputWrapper icon={Clock} label={t("profile.timezone")}>
                <Select
                  value={formData.timezone}
                  onValueChange={(val) => setFormData((p) => ({ ...p, timezone: val }))}
                >
                  <SelectTrigger className={styles.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={styles.selectContent}>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz} className="font-rajdhani focus:bg-primary/20 focus:text-primary">
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CyberInputWrapper>

              <div className="grid grid-cols-2 gap-4">
                <CyberInputWrapper icon={Languages} label={t("profile.language")}>
                  <Select
                    value={formData.language}
                    onValueChange={(val) => setFormData((p) => ({ ...p, language: val }))}
                  >
                    <SelectTrigger className={styles.selectTrigger}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={styles.selectContent}>
                      <SelectItem value="en" className="focus:bg-primary/20">
                        English
                      </SelectItem>
                      <SelectItem value="fr" className="focus:bg-primary/20">
                        Français
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CyberInputWrapper>

                <CyberInputWrapper icon={Coins} label={t("profile.currency")}>
                  <Select
                    value={formData.currency}
                    onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}
                  >
                    <SelectTrigger className={styles.selectTrigger}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={styles.selectContent}>
                      <SelectItem value="eur" className="focus:bg-primary/20">
                        EUR (€)
                      </SelectItem>
                      <SelectItem value="usd" className="focus:bg-primary/20">
                        USD ($)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CyberInputWrapper>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
