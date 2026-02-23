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
  Check,
  AlertCircle,
  Fingerprint,
  KeyRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { cn } from "@/lib/utils";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

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

// ─── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  input:
    "bg-white/[0.03] border-white/10 focus:border-primary/50 focus:bg-white/[0.05] transition-all duration-200 font-rajdhani rounded-xl text-sm placeholder:text-white/20 h-11",
  selectTrigger:
    "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200 font-rajdhani rounded-xl text-sm h-11",
  selectContent:
    "bg-[#0c1220]/98 backdrop-blur-2xl border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden",
  card: "bg-white/[0.02] backdrop-blur-md border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.3)_inset] rounded-2xl overflow-hidden",
  label: "text-[10px] uppercase tracking-[0.12em] text-white/40 font-rajdhani font-semibold",
};

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-orbitron text-white/90 tracking-wider">{title}</h3>
        {subtitle && <p className="text-[11px] text-white/30 font-rajdhani mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className={S.label}>{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-white/25 font-rajdhani pl-0.5">{hint}</p>}
    </div>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="border-t border-white/[0.05] my-6" />;
}

// ─── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase font-rajdhani px-2.5 py-1 rounded-full",
        active
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-white/5 text-white/30 border border-white/10",
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-400" : "bg-white/20")} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function ProfileAccountSettings({ userId, initialData }: ProfileAccountSettingsProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();

  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: t("profile.updatedTitle"), description: t("profile.updatedDesc") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {/* ── Personal Info ─────────────────────────────────────────────── */}
      <Card className={S.card}>
        <CardContent className="p-6">
          <SectionHeader icon={User} title={t("profile.personalInfo")} subtitle="Your public identity" />

          <div className="space-y-5">
            <Field label={t("common.email")} hint={t("profile.emailCantChange")}>
              <div className="relative">
                <Input value={formData.email} disabled className={cn(S.input, "opacity-40 cursor-not-allowed pr-10")} />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
              </div>
            </Field>

            <Field label={t("profile.displayName")}>
              <Input
                placeholder={t("profile.displayNamePlaceholder")}
                value={formData.displayName}
                onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                className={S.input}
              />
            </Field>

            <Field label={t("profile.birthday")}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-rajdhani",
                      S.selectTrigger,
                      !formData.birthday && "text-white/20",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-white/30" />
                      {formData.birthday
                        ? format(formData.birthday, "PPP", { locale: dateLocale })
                        : t("profile.birthdayPlaceholder")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/20" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={cn("w-auto p-0", S.selectContent)} align="start">
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
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Regional Preferences ──────────────────────────────────────── */}
      <Card className={S.card}>
        <CardContent className="p-6">
          <SectionHeader icon={Globe} title={t("profile.regionalPreferences")} subtitle="Localization & display" />

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("profile.country")}>
              <Select value={formData.country} onValueChange={(val) => setFormData((p) => ({ ...p, country: val }))}>
                <SelectTrigger className={S.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={S.selectContent}>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`profile.countries.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("profile.timezone")}>
              <Select value={formData.timezone} onValueChange={(val) => setFormData((p) => ({ ...p, timezone: val }))}>
                <SelectTrigger className={S.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={S.selectContent}>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("profile.language")}>
              <Select value={formData.language} onValueChange={(val) => setFormData((p) => ({ ...p, language: val }))}>
                <SelectTrigger className={S.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={S.selectContent}>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("profile.currency")}>
              <Select value={formData.currency} onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}>
                <SelectTrigger className={S.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={S.selectContent}>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Password ──────────────────────────────────────────────────── */}
      <ChangePasswordSection />

      {/* ── 2FA ───────────────────────────────────────────────────────── */}
      <TwoFactorSection />

      {/* ── Save ──────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2 pb-6">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "relative h-11 min-w-[180px] rounded-xl font-orbitron text-xs tracking-widest uppercase overflow-hidden transition-all duration-300",
              saved
                ? "bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400"
                : "bg-primary/15 border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/25 text-primary shadow-[0_0_24px_rgba(var(--primary-rgb),0.15)] hover:shadow-[0_0_32px_rgba(var(--primary-rgb),0.25)]",
            )}
          >
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </motion.span>
              ) : saved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Saved
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {t("common.saveChanges")}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────
function ChangePasswordSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-blue-400", "bg-emerald-400"][passwordStrength];

  const mismatch = confirmPassword && newPassword !== confirmPassword;

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
    <Card className={S.card}>
      <CardContent className="p-6">
        <SectionHeader
          icon={KeyRound}
          title={t("profile.changePassword.title")}
          subtitle="Update your login credentials"
        />

        <div className="space-y-4">
          <Field label={t("profile.changePassword.newPassword")}>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(S.input, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength bar */}
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pt-2 space-y-1.5"
              >
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-0.5 flex-1 rounded-full transition-all duration-300",
                        i <= passwordStrength ? strengthColor : "bg-white/10",
                      )}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-white/30 font-rajdhani">{strengthLabel}</p>
              </motion.div>
            )}
          </Field>

          <Field label={t("profile.changePassword.confirmPassword")}>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(S.input, "pr-10", mismatch && "border-red-500/40 focus:border-red-500/60")}
              />
              <AnimatePresence>
                {mismatch && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <AlertCircle size={15} className="text-red-400" />
                  </motion.div>
                )}
                {confirmPassword && !mismatch && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Check size={15} className="text-emerald-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Field>

          <Button
            onClick={handleChangePassword}
            disabled={isSaving || !newPassword || !confirmPassword || !!mismatch}
            className="h-10 px-5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] text-white/60 hover:text-white/90 font-orbitron text-[10px] tracking-widest uppercase transition-all duration-200"
          >
            {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Lock className="mr-2 h-3.5 w-3.5" />}
            {isSaving ? t("common.saving") : t("profile.changePassword.update")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Two-Factor Auth ──────────────────────────────────────────────────────────
function TwoFactorSection() {
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
    <Card className={S.card}>
      <CardContent className="p-6">
        <SectionHeader
          icon={Fingerprint}
          title={t("profile.twoFactor.title")}
          subtitle="Add extra layers of security"
        />

        <div className="space-y-3">
          {/* TOTP Row */}
          <div className="group flex items-center justify-between gap-4 rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-3.5 hover:border-white/10 hover:bg-white/[0.03] transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/15">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80 font-rajdhani">Authenticator App</p>
                <StatusPill
                  active={twoFactor.enabled}
                  activeLabel={t("twoFactor.email2fa.active")}
                  inactiveLabel={t("twoFactor.email2fa.inactive")}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="h-8 px-3 rounded-lg text-[10px] font-orbitron tracking-widest uppercase bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.07] text-white/50 hover:text-white/80 transition-all"
            >
              {t("profile.twoFactor.manage")}
            </Button>
          </div>

          {/* Email 2FA Row */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:border-white/10 transition-all duration-200">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/15">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80 font-rajdhani">{t("twoFactor.email2fa.title")}</p>
                  <StatusPill
                    active={twoFactor.emailEnabled}
                    activeLabel={t("twoFactor.email2fa.active")}
                    inactiveLabel={t("twoFactor.email2fa.inactive")}
                  />
                </div>
              </div>

              {twoFactor.emailEnabled ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisableEmail2FA}
                  disabled={disablingEmail}
                  className="h-8 px-3 rounded-lg text-[10px] font-orbitron tracking-widest uppercase bg-red-500/8 border border-red-500/15 hover:border-red-500/30 hover:bg-red-500/15 text-red-400/70 hover:text-red-400 transition-all"
                >
                  {disablingEmail && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  {disablingEmail ? t("twoFactor.email2fa.disabling") : t("twoFactor.email2fa.disable")}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEnableEmail2FA}
                  disabled={enablingEmail || showEmailConfirm}
                  className="h-8 px-3 rounded-lg text-[10px] font-orbitron tracking-widest uppercase bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.07] text-white/50 hover:text-white/80 transition-all"
                >
                  {enablingEmail && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  {enablingEmail ? t("twoFactor.email2fa.enabling") : t("twoFactor.email2fa.enable")}
                </Button>
              )}
            </div>

            {/* Confirmation flow */}
            <AnimatePresence>
              {showEmailConfirm && !twoFactor.emailEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-3 border-t border-white/[0.05] space-y-4">
                    <p className="text-xs text-white/35 font-rajdhani">{t("twoFactor.email2fa.confirmDesc")}</p>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={emailConfirmCode} onChange={setEmailConfirmCode}>
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className="w-9 h-11 rounded-lg bg-white/[0.04] border-white/10 focus:border-primary/50 text-sm font-orbitron"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button
                      onClick={handleConfirmEmail2FA}
                      disabled={confirmingEmail || emailConfirmCode.length < 6}
                      className="w-full h-10 rounded-xl bg-primary/15 border border-primary/25 hover:border-primary/45 hover:bg-primary/25 text-primary font-orbitron text-[10px] tracking-widest uppercase transition-all duration-200"
                    >
                      {confirmingEmail && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                      {confirmingEmail ? t("twoFactor.email2fa.confirming") : t("twoFactor.email2fa.confirmButton")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
