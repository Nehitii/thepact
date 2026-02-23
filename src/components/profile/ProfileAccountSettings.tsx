import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Lock,
  Eye,
  EyeOff,
  Smartphone,
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTwoFactor } from "@/hooks/useTwoFactor";
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
            <User className="h-5 w-5" /> {t("profile.personalInfo")}
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
            <Globe className="h-5 w-5" /> {t("profile.regionalPreferences")}
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

      {/* SECTION 3: CHANGE PASSWORD */}
      <ChangePasswordSection styles={styles} />

      {/* SECTION 4: TWO-FACTOR AUTH */}
      <TwoFactorSection styles={styles} />

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

function ChangePasswordSection({ styles }: { styles: { card: string; input: string } }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: t("common.error"), description: t("profile.changePassword.minLength"), variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t("common.error"), description: t("profile.changePassword.mismatch"), variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: t("common.success"), description: t("profile.changePassword.success") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={styles.card}>
      <CardContent className="p-6">
        <h3 className="text-lg font-orbitron text-primary mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5" /> {t("profile.changePassword.title")}
        </h3>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-primary/70">{t("profile.changePassword.newPassword")}</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-primary/70">{t("profile.changePassword.confirmPassword")}</Label>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={styles.input}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isSaving || !newPassword || !confirmPassword}
            className="bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {isSaving ? t("common.saving") : t("profile.changePassword.update")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TwoFactorSection({ styles }: { styles: { card: string; input: string } }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const twoFactor = useTwoFactor();

  const [enablingEmail, setEnablingEmail] = useState(false);
  const [confirmingEmail, setConfirmingEmail] = useState(false);
  const [emailConfirmCode, setEmailConfirmCode] = useState("");
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [disablingEmail, setDisablingEmail] = useState(false);

  const invokeAction = async (payload: any) => {
    const accessToken = session?.access_token;
    if (!accessToken) return null;
    const { data, error } = await supabase.functions.invoke("two-factor", {
      body: payload,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (error) throw error;
    return data;
  };

  const handleEnableEmail2FA = async () => {
    setEnablingEmail(true);
    try {
      await invokeAction({ action: "enable_email_2fa" });
      setShowEmailConfirm(true);
      toast({ title: t("twoFactor.emailSentTitle"), description: t("twoFactor.emailSentDesc") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e?.message || "Error", variant: "destructive" });
    } finally {
      setEnablingEmail(false);
    }
  };

  const handleConfirmEmail2FA = async () => {
    setConfirmingEmail(true);
    try {
      await invokeAction({ action: "confirm_email_2fa", code: emailConfirmCode });
      setShowEmailConfirm(false);
      setEmailConfirmCode("");
      twoFactor.refetch();
      toast({ title: t("common.success"), description: t("twoFactor.email2fa.enabledSuccess") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e?.message || "Error", variant: "destructive" });
    } finally {
      setConfirmingEmail(false);
    }
  };

  const handleDisableEmail2FA = async () => {
    setDisablingEmail(true);
    try {
      await invokeAction({ action: "disable_email_2fa" });
      twoFactor.refetch();
      toast({ title: t("common.success"), description: t("twoFactor.email2fa.disabledSuccess") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e?.message || "Error", variant: "destructive" });
    } finally {
      setDisablingEmail(false);
    }
  };

  return (
    <Card className={styles.card}>
      <CardContent className="p-6 space-y-6">
        <h3 className="text-lg font-orbitron text-primary flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> {t("profile.twoFactor.title")}
        </h3>
        <p className="text-sm text-muted-foreground font-rajdhani">
          {t("profile.twoFactor.description")}
        </p>

        {/* TOTP Section */}
        <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/30 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              Authenticator App
            </p>
            <p className="text-xs text-muted-foreground">
              {twoFactor.enabled ? t("twoFactor.email2fa.active") : t("twoFactor.email2fa.inactive")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/profile")}
            className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
          >
            {t("profile.twoFactor.manage")}
          </Button>
        </div>

        {/* Email 2FA Section */}
        <div className="rounded-xl border border-primary/10 bg-background/30 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                {t("twoFactor.email2fa.title")}
              </p>
              <p className="text-xs text-muted-foreground">{t("twoFactor.email2fa.description")}</p>
            </div>
            {twoFactor.emailEnabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisableEmail2FA}
                disabled={disablingEmail}
                className="bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
              >
                {disablingEmail ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                {disablingEmail ? t("twoFactor.email2fa.disabling") : t("twoFactor.email2fa.disable")}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnableEmail2FA}
                disabled={enablingEmail || showEmailConfirm}
                className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
              >
                {enablingEmail ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                {enablingEmail ? t("twoFactor.email2fa.enabling") : t("twoFactor.email2fa.enable")}
              </Button>
            )}
          </div>

          {/* Confirmation flow */}
          {showEmailConfirm && !twoFactor.emailEnabled && (
            <div className="space-y-3 pt-2 border-t border-primary/10">
              <p className="text-sm text-muted-foreground">{t("twoFactor.email2fa.confirmDesc")}</p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={emailConfirmCode} onChange={setEmailConfirmCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={handleConfirmEmail2FA}
                disabled={confirmingEmail || emailConfirmCode.length < 6}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
              >
                {confirmingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {confirmingEmail ? t("twoFactor.email2fa.confirming") : t("twoFactor.email2fa.confirmButton")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
