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
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
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

// Wrapper pour les champs Neumorphic
const NeuField = ({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon: any;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("space-y-3 group", className)}>
    <Label className="text-xs font-orbitron tracking-widest text-muted-foreground/70 flex items-center gap-2 group-focus-within:text-primary transition-colors uppercase">
      <Icon size={12} className="text-primary/60" /> {label}
    </Label>
    <div className="relative transition-all duration-300 hover:brightness-110">{children}</div>
  </div>
);

export function ProfileAccountSettings({ userId, initialData }: ProfileAccountSettingsProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();

  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // Styles Neumorphic basés sur votre index.css
  const styles = {
    // Carte principale : fond sombre avec ombre portée douce
    card: "neu-card p-8 relative overflow-hidden",
    // Inputs enfoncés : fond sombre intérieur, pas de bordure par défaut
    inputInset:
      "neu-inset bg-transparent border-none text-foreground placeholder:text-muted-foreground/30 h-12 px-4 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all font-rajdhani tracking-wide text-lg",
    // Select trigger identique aux inputs
    selectTrigger:
      "neu-inset bg-transparent border-none h-12 w-full px-4 text-foreground focus:ring-1 focus:ring-primary/30 font-rajdhani text-lg flex items-center justify-between",
    // Menu déroulant style verre
    selectContent: "bg-[#0f1216]/95 backdrop-blur-xl border border-white/5 text-foreground shadow-2xl rounded-xl",
    // Bouton d'action principal
    buttonPrimary:
      "neu-button bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 h-12 px-8 font-orbitron tracking-wider text-sm hover:scale-[1.02] active:scale-[0.98] transition-all",
    // Section headers
    sectionTitle:
      "text-xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40 mb-6 flex items-center gap-3",
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
        title: "Configuration Synchronisée",
        description: t("profile.updatedDesc"),
        className: "bg-[#0f1216] border-primary/20 text-primary font-rajdhani",
      });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      {/* En-tête de page simple et élégant */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 px-1">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-white tracking-tight">
            {t("profile.settingsTitle", "PARAMÈTRES")}
          </h2>
          <p className="text-muted-foreground font-rajdhani text-lg mt-1">
            Gérez votre identité numérique et vos préférences régionales.
          </p>
        </div>

        {/* Indicateur de modification non sauvegardée (optionnel) */}
        {JSON.stringify(formData) !== JSON.stringify(initialData) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-rajdhani text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20"
          >
            Modifications non enregistrées
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLONNE GAUCHE : IDENTITÉ (Largeur 7/12) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col gap-6">
          <div className={styles.card}>
            {/* Effet de lueur d'ambiance */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <h3 className={styles.sectionTitle}>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 shadow-inner">
                <User className="h-5 w-5 text-primary" />
              </div>
              {t("profile.sections.identity")}
            </h3>

            <div className="space-y-6">
              <NeuField icon={Mail} label={t("common.email")}>
                <Input
                  value={formData.email}
                  disabled
                  className={cn(styles.inputInset, "opacity-60 cursor-not-allowed border border-white/5")}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-orbitron bg-white/5 text-muted-foreground border border-white/5">
                  <ShieldCheck size={10} /> ID SÉCURISÉ
                </div>
              </NeuField>

              <div className="grid md:grid-cols-2 gap-6">
                <NeuField icon={User} label={t("profile.displayName")}>
                  <Input
                    placeholder="Votre pseudo..."
                    value={formData.displayName}
                    onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                    className={styles.inputInset}
                  />
                </NeuField>

                <NeuField icon={CalendarIcon} label={t("profile.birthday")}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(styles.selectTrigger, !formData.birthday && "text-muted-foreground")}
                      >
                        <span>
                          {formData.birthday
                            ? format(formData.birthday, "PPP", { locale: dateLocale })
                            : t("profile.birthdayPlaceholder")}
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={cn("w-auto p-0 border-white/10", styles.selectContent)} align="start">
                      <Calendar
                        mode="single"
                        selected={formData.birthday}
                        onSelect={(date) => setFormData((p) => ({ ...p, birthday: date }))}
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                        initialFocus
                        className="bg-transparent text-foreground p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </NeuField>
              </div>
            </div>
          </div>
        </motion.div>

        {/* COLONNE DROITE : LOCALISATION (Largeur 5/12) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col h-full gap-6">
          <div className={cn(styles.card, "flex-1 flex flex-col")}>
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <h3 className={styles.sectionTitle}>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 shadow-inner">
                <Globe className="h-5 w-5 text-purple-400" />
              </div>
              {t("profile.sections.localization")}
            </h3>

            <div className="space-y-6 flex-1">
              <NeuField icon={MapPin} label={t("profile.country")}>
                <Select value={formData.country} onValueChange={(val) => setFormData((p) => ({ ...p, country: val }))}>
                  <SelectTrigger className={styles.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={styles.selectContent}>
                    {COUNTRIES.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        className="font-rajdhani focus:bg-white/10 focus:text-primary cursor-pointer"
                      >
                        {t(`profile.countries.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </NeuField>

              <NeuField icon={Clock} label={t("profile.timezone")}>
                <Select
                  value={formData.timezone}
                  onValueChange={(val) => setFormData((p) => ({ ...p, timezone: val }))}
                >
                  <SelectTrigger className={styles.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={styles.selectContent}>
                    {TIMEZONES.map((tz) => (
                      <SelectItem
                        key={tz}
                        value={tz}
                        className="font-rajdhani focus:bg-white/10 focus:text-primary cursor-pointer"
                      >
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </NeuField>

              <div className="grid grid-cols-2 gap-4">
                <NeuField icon={Languages} label={t("profile.language")}>
                  <Select
                    value={formData.language}
                    onValueChange={(val) => setFormData((p) => ({ ...p, language: val }))}
                  >
                    <SelectTrigger className={styles.selectTrigger}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={styles.selectContent}>
                      <SelectItem value="en" className="focus:bg-white/10 cursor-pointer">
                        English
                      </SelectItem>
                      <SelectItem value="fr" className="focus:bg-white/10 cursor-pointer">
                        Français
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </NeuField>

                <NeuField icon={Coins} label={t("profile.currency")}>
                  <Select
                    value={formData.currency}
                    onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}
                  >
                    <SelectTrigger className={styles.selectTrigger}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={styles.selectContent}>
                      <SelectItem value="eur" className="focus:bg-white/10 cursor-pointer">
                        EUR (€)
                      </SelectItem>
                      <SelectItem value="usd" className="focus:bg-white/10 cursor-pointer">
                        USD ($)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </NeuField>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Bar Flottante */}
      <motion.div variants={itemVariants} className="flex justify-end pt-4 border-t border-white/5">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(styles.buttonPrimary, "min-w-[240px] shadow-[0_0_20px_rgba(var(--primary),0.15)]")}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "SAUVEGARDE EN COURS..." : t("common.saveChanges").toUpperCase()}
        </Button>
      </motion.div>
    </motion.div>
  );
}
