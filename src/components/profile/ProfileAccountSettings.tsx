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
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Check,
  AlertCircle,
  Fingerprint,
  KeyRound,
  Activity,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { cn } from "@/lib/utils";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import {
  SettingsBreadcrumb, CyberSeparator, DataPanel, SyncIndicator, TerminalLog,
} from "@/components/profile/settings-ui";

// ─── Constants ────────────────────────────────────────────────────────────────
const TIMEZONES = [
  "UTC", "Europe/Paris", "Europe/London", "America/New_York",
  "America/Los_Angeles", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney",
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

// ─── Clip-corner helpers ──────────────────────────────────────────────────────
const clipSm = {
  clipPath: "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const CY = {
  input: [
    "bg-[#010608] border border-primary/25 rounded-none",
    "focus:border-primary/70 focus:bg-[#010b10]",
    "focus:shadow-[0_0_0_1px_hsl(var(--primary)/0.2),inset_0_0_16px_hsl(var(--primary)/0.03)]",
    "text-primary/80 placeholder:text-primary/15 font-mono text-sm tracking-wide h-11",
    "transition-all duration-200",
  ].join(" "),

  selectTrigger: [
    "bg-[#010608] border border-primary/25 rounded-none h-11",
    "hover:border-primary/50 hover:bg-[#010b10]",
    "text-primary/80 font-mono text-sm tracking-wide",
    "transition-all duration-200",
  ].join(" "),

  selectContent: [
    "bg-[#020c12]/99 backdrop-blur-2xl rounded-none",
    "border border-primary/20",
    "shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_0_1px_hsl(var(--primary)/0.08)]",
  ].join(" "),

  label: "text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold",

  btnPrimary: [
    "relative rounded-none bg-primary/10 border border-primary/35",
    "hover:bg-primary/18 hover:border-primary/65",
    "text-primary font-mono text-[10px] tracking-[0.22em] uppercase",
    "shadow-[0_0_14px_hsl(var(--primary)/0.12)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.28)]",
    "disabled:opacity-30 disabled:cursor-not-allowed",
    "transition-all duration-200 h-10",
  ].join(" "),

  btnGhost: [
    "relative rounded-none bg-transparent border border-primary/12",
    "hover:border-primary/30 hover:bg-primary/5",
    "text-primary/35 hover:text-primary/65 font-mono text-[10px] tracking-[0.22em] uppercase",
    "transition-all duration-200 h-8",
  ].join(" "),

  btnDestructive: [
    "relative rounded-none bg-red-950/20 border border-red-500/25",
    "hover:bg-red-900/25 hover:border-red-400/45",
    "text-red-400/70 hover:text-red-400 font-mono text-[10px] tracking-[0.22em] uppercase",
    "disabled:opacity-30 disabled:cursor-not-allowed",
    "transition-all duration-200 h-8",
  ].join(" "),
};

// ─── Corner brackets ──────────────────────────────────────────────────────────
function CornerBrackets({ dim = false, red = false }: { dim?: boolean; red?: boolean }) {
  const c = red ? "border-red-500/35" : dim ? "border-primary/15" : "border-primary/30";
  return (
    <>
      <span className={cn("absolute top-0 left-0 w-2.5 h-2.5 border-t border-l pointer-events-none", c)} />
      <span className={cn("absolute top-0 right-0 w-2.5 h-2.5 border-t border-r pointer-events-none", c)} />
      <span className={cn("absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l pointer-events-none", c)} />
      <span className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r pointer-events-none", c)} />
    </>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
        <Label className={CY.label}>{label}</Label>
      </div>
      {children}
      {hint && (
        <p className="text-[9px] text-primary/20 font-mono tracking-wider pl-2.5 border-l border-primary/10">{hint}</p>
      )}
    </div>
  );
}

// ─── Status chip ──────────────────────────────────────────────────────────────
function StatusChip({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[8px] tracking-[0.18em] uppercase border",
        active
          ? "bg-emerald-950/60 border-emerald-500/25 text-emerald-400/80"
          : "bg-primary/4 border-primary/12 text-primary/25",
      )}
      style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}
    >
      <motion.span
        animate={active ? { opacity: [1, 0.2, 1] } : {}}
        transition={{ duration: 2.5, repeat: Infinity }}
        className={cn("w-1 h-1 rounded-full shrink-0", active ? "bg-emerald-400" : "bg-primary/20")}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

// ─── CyInput ──────────────────────────────────────────────────────────────────
function CyInput({ className, disabled, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input {...props} disabled={disabled} className={cn(CY.input, "rounded-none", disabled && "opacity-30 cursor-not-allowed", className)} style={clipSm} />
      <CornerBrackets dim={disabled} />
    </div>
  );
}

// ─── CySelect ─────────────────────────────────────────────────────────────────
function CySelect({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(CY.selectTrigger)} style={clipSm}><SelectValue /></SelectTrigger>
        <SelectContent className={CY.selectContent}>{children}</SelectContent>
      </Select>
      <CornerBrackets dim />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfileAccountSettings({ userId, initialData }: ProfileAccountSettingsProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();

  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [logLines, setLogLines] = useState<{ text: string; type: "ok" | "warn" | "info" }[]>([
    { text: "ACCOUNT SETTINGS LOADED", type: "info" },
    { text: "IDENTITY MATRIX: ONLINE", type: "ok" },
    { text: "AUTH MODULE: CONNECTED", type: "info" },
  ]);

  const addLog = (text: string, type: "ok" | "warn" | "info") => {
    setLogLines(prev => {
      const next = [...prev, { text, type }];
      return next.length > 5 ? next.slice(-5) : next;
    });
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
      if (formData.language !== i18n.language) await i18n.changeLanguage(formData.language);
      updateGlobalCurrency(formData.currency);
      await refreshCurrency();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      addLog("PROFILE DATA COMMITTED", "ok");
      toast({ title: t("profile.updatedTitle"), description: t("profile.updatedDesc") });
    } catch (error: any) {
      addLog("COMMIT FAILED: " + error.message, "warn");
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-2xl mx-auto space-y-4 pb-8">
      <SettingsBreadcrumb code="ACC.01" />
      <CyberSeparator />

      {/* ─── SECTION 01 : Identity ──────────────────────────────────── */}
      <DataPanel code="MODULE_01" title="IDENTITY MATRIX" footerLeft={<span>USER: <b className="text-primary">{formData.displayName || formData.email}</b></span>}>
        <div className="py-5 space-y-5">
          <Field label={t("common.email")} hint={t("profile.emailCantChange")}>
            <div className="relative">
              <CyInput value={formData.email} disabled />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-primary/15 pointer-events-none z-10" />
            </div>
          </Field>

          <Field label={t("profile.displayName")}>
            <CyInput
              placeholder={t("profile.displayNamePlaceholder")}
              value={formData.displayName}
              onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
            />
          </Field>

          <Field label={t("profile.birthday")}>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "relative w-full flex items-center justify-between px-3 h-11",
                    "bg-[#010608] border border-primary/25",
                    "hover:border-primary/50 hover:bg-[#010b10]",
                    "text-primary/80 font-mono text-sm tracking-wide",
                    "transition-all duration-200",
                    !formData.birthday && "text-primary/20",
                  )}
                  style={clipSm}
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary/35 shrink-0" />
                    {formData.birthday ? format(formData.birthday, "PPP", { locale: dateLocale }) : t("profile.birthdayPlaceholder")}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-primary/25 shrink-0" />
                  <CornerBrackets dim />
                </button>
              </PopoverTrigger>
              <PopoverContent className={cn("w-auto p-0", CY.selectContent)} align="start">
                <Calendar mode="single" selected={formData.birthday} onSelect={(date) => setFormData((p) => ({ ...p, birthday: date }))} fromYear={1920} toYear={new Date().getFullYear()} initialFocus />
              </PopoverContent>
            </Popover>
          </Field>
        </div>
      </DataPanel>

      {/* ─── SECTION 02 : Regional ──────────────────────────────────── */}
      <DataPanel code="MODULE_02" title="LOCALE CONFIG" footerLeft={<span>LANG: <b className="text-primary">{formData.language.toUpperCase()}</b></span>} footerRight={<span>TZ: <b className="text-primary">{formData.timezone}</b></span>}>
        <div className="py-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Field label={t("profile.country")}>
              <CySelect value={formData.country} onValueChange={(v) => setFormData((p) => ({ ...p, country: v }))}>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c} className="font-mono text-xs tracking-wider">{t(`profile.countries.${c}`)}</SelectItem>
                ))}
              </CySelect>
            </Field>
            <Field label={t("profile.timezone")}>
              <CySelect value={formData.timezone} onValueChange={(v) => setFormData((p) => ({ ...p, timezone: v }))}>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz} className="font-mono text-xs">{tz}</SelectItem>
                ))}
              </CySelect>
            </Field>
            <Field label={t("profile.language")}>
              <CySelect value={formData.language} onValueChange={(v) => setFormData((p) => ({ ...p, language: v }))}>
                <SelectItem value="en" className="font-mono text-xs">English</SelectItem>
                <SelectItem value="fr" className="font-mono text-xs">Français</SelectItem>
              </CySelect>
            </Field>
            <Field label={t("profile.currency")}>
              <CySelect value={formData.currency} onValueChange={(v) => setFormData((p) => ({ ...p, currency: v }))}>
                <SelectItem value="eur" className="font-mono text-xs">EUR (€)</SelectItem>
                <SelectItem value="usd" className="font-mono text-xs">USD ($)</SelectItem>
              </CySelect>
            </Field>
          </div>
        </div>
      </DataPanel>

      {/* ─── SECTION 03 : Password ──────────────────────────────────── */}
      <ChangePasswordSection onLog={addLog} />

      {/* ─── SECTION 04 : 2FA ───────────────────────────────────────── */}
      <TwoFactorSection onLog={addLog} />

      {/* ─── Save ───────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "relative h-11 min-w-[220px] font-mono text-[10px] tracking-[0.28em] uppercase",
            "border overflow-hidden transition-all duration-300",
            saved
              ? "bg-emerald-950/40 border-emerald-500/45 text-emerald-400"
              : "bg-primary/8 border-primary/35 text-primary hover:bg-primary/14 hover:border-primary/65 shadow-[0_0_18px_hsl(var(--primary)/0.14)]",
            "disabled:opacity-40",
          )}
          style={clipSm}
        >
          <CornerBrackets />
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 relative z-10">
                <Activity className="h-3.5 w-3.5 animate-pulse" /> PROCESSING...
              </motion.span>
            ) : saved ? (
              <motion.span key="saved" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 relative z-10">
                <Check className="h-3.5 w-3.5" /> DATA COMMITTED
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">[ COMMIT CHANGES ]</motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <TerminalLog lines={logLines} />
      <div className="h-8" />
    </motion.div>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────
function ChangePasswordSection({ onLog }: { onLog: (text: string, type: "ok" | "warn" | "info") => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  }, [newPassword]);

  const strengthMeta = [
    null,
    { label: "WEAK", color: "bg-red-500", glow: "shadow-[0_0_5px_rgba(239,68,68,0.6)]" },
    { label: "FAIR", color: "bg-amber-400", glow: "shadow-[0_0_5px_rgba(251,191,36,0.6)]" },
    { label: "GOOD", color: "bg-cyan-400", glow: "shadow-[0_0_5px_rgba(34,211,238,0.6)]" },
    { label: "STRONG", color: "bg-emerald-400", glow: "shadow-[0_0_5px_rgba(52,211,153,0.6)]" },
  ][passwordStrength];

  const mismatch = !!confirmPassword && newPassword !== confirmPassword;

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: t("common.error"), description: t("profile.changePassword.minLength"), variant: "destructive" });
      return;
    }
    if (mismatch) {
      toast({ title: t("common.error"), description: t("profile.changePassword.mismatch"), variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      onLog("PASSWORD HASH UPDATED", "ok");
      toast({ title: t("common.success"), description: t("profile.changePassword.success") });
    } catch (error: any) {
      onLog("PASSWORD UPDATE FAILED", "warn");
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DataPanel code="MODULE_03" title="CREDENTIAL UPDATE">
      <div className="py-5 space-y-5">
        <Field label={t("profile.changePassword.newPassword")}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(CY.input, "rounded-none pr-10")}
              style={clipSm}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary/55 transition-colors z-10"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <CornerBrackets dim />
          </div>

          <AnimatePresence>
            {newPassword && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn("h-0.5 flex-1 transition-all duration-300", i <= passwordStrength ? cn(strengthMeta?.color, strengthMeta?.glow) : "bg-primary/8")} />
                  ))}
                  {strengthMeta && <span className="font-mono text-[8px] tracking-[0.22em] text-primary/35 w-12 text-right shrink-0">{strengthMeta.label}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Field>

        <Field label={t("profile.changePassword.confirmPassword")}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(CY.input, "rounded-none pr-10", mismatch && "border-red-500/40")}
              style={clipSm}
            />
            <AnimatePresence>
              {mismatch && (
                <motion.div key="err" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <AlertCircle size={14} className="text-red-400" />
                </motion.div>
              )}
              {confirmPassword && !mismatch && (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <Check size={14} className="text-emerald-400" />
                </motion.div>
              )}
            </AnimatePresence>
            <CornerBrackets dim={!mismatch} red={mismatch} />
          </div>
        </Field>

        <button
          onClick={handleChangePassword}
          disabled={isSaving || !newPassword || !confirmPassword || mismatch}
          className={cn(CY.btnPrimary, "px-6 flex items-center gap-2")}
          style={clipSm}
        >
          {isSaving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> PROCESSING</>) : (<><Lock className="h-3.5 w-3.5" />{t("profile.changePassword.update")}</>)}
        </button>
      </div>
    </DataPanel>
  );
}

// ─── Two-Factor Auth ──────────────────────────────────────────────────────────
function TwoFactorSection({ onLog }: { onLog: (text: string, type: "ok" | "warn" | "info") => void }) {
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
    const token = session?.access_token;
    if (!token) return null;
    const { data, error } = await supabase.functions.invoke("two-factor", {
      body: payload,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) throw error;
    return data;
  };

  const handleEnableEmail2FA = async () => {
    setEnablingEmail(true);
    try {
      await invokeAction({ action: "enable_email_2fa" });
      setShowEmailConfirm(true);
      onLog("EMAIL 2FA CODE SENT", "info");
      toast({ title: t("twoFactor.emailSentTitle"), description: t("twoFactor.emailSentDesc") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e?.message, variant: "destructive" });
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
      onLog("EMAIL 2FA: ENABLED", "ok");
      toast({ title: t("common.success"), description: t("twoFactor.email2fa.enabledSuccess") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e?.message, variant: "destructive" });
    } finally {
      setConfirmingEmail(false);
    }
  };

  const handleDisableEmail2FA = async () => {
    setDisablingEmail(true);
    try {
      await invokeAction({ action: "disable_email_2fa" });
      twoFactor.refetch();
      onLog("EMAIL 2FA: DISABLED", "warn");
      toast({ title: t("common.success"), description: t("twoFactor.email2fa.disabledSuccess") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e?.message, variant: "destructive" });
    } finally {
      setDisablingEmail(false);
    }
  };

  const TFARow = ({ icon: Icon, label, active, onEnable, onDisable, enabling, disabling, blockEnable = false, enableLabel, disableLabel, enablingLabel, disablingLabel }: any) => (
    <div className="relative border border-primary/12 bg-primary/[0.015]" style={clipSm}>
      <CornerBrackets dim />
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/8 border border-primary/20 shrink-0" style={{ clipPath: "polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)" }}>
            <Icon className="h-3.5 w-3.5 text-primary/70" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-primary/65 tracking-wider">{label}</p>
            <StatusChip active={active} activeLabel={t("twoFactor.email2fa.active")} inactiveLabel={t("twoFactor.email2fa.inactive")} />
          </div>
        </div>
        {active ? (
          <button onClick={onDisable} disabled={disabling} className={cn(CY.btnDestructive, "px-3")} style={clipSm}>
            {disabling && <Loader2 className="inline mr-1.5 h-3 w-3 animate-spin" />}
            {disabling ? disablingLabel : disableLabel}
          </button>
        ) : (
          <button onClick={onEnable} disabled={enabling || blockEnable} className={cn(CY.btnGhost, "px-3")} style={clipSm}>
            {enabling && <Loader2 className="inline mr-1.5 h-3 w-3 animate-spin" />}
            {enabling ? enablingLabel : enableLabel}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <DataPanel code="MODULE_04" title="SECURITY LAYER"
      footerLeft={<span>TOTP: <b className={cn(twoFactor.enabled ? "text-primary" : "text-muted-foreground")}>{twoFactor.enabled ? "ON" : "OFF"}</b></span>}
      footerRight={<span>EMAIL: <b className={cn(twoFactor.emailEnabled ? "text-[hsl(195,100%,50%)]" : "text-muted-foreground")}>{twoFactor.emailEnabled ? "ON" : "OFF"}</b></span>}
    >
      <div className="py-5 space-y-2">
        {/* TOTP */}
        <TFARow
          icon={Smartphone}
          label="Authenticator App"
          active={twoFactor.enabled}
          onEnable={() => navigate("/profile")}
          onDisable={() => navigate("/profile")}
          enabling={false}
          disabling={false}
          enableLabel={t("profile.twoFactor.manage")}
          disableLabel={t("profile.twoFactor.manage")}
          enablingLabel="..."
          disablingLabel="..."
        />

        {/* Email 2FA */}
        <div className="relative border border-primary/12 bg-primary/[0.015] overflow-hidden" style={clipSm}>
          <CornerBrackets dim />
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/8 border border-primary/20 shrink-0" style={{ clipPath: "polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)" }}>
                <Mail className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-mono text-primary/65 tracking-wider">{t("twoFactor.email2fa.title")}</p>
                <StatusChip active={twoFactor.emailEnabled} activeLabel={t("twoFactor.email2fa.active")} inactiveLabel={t("twoFactor.email2fa.inactive")} />
              </div>
            </div>

            {twoFactor.emailEnabled ? (
              <button onClick={handleDisableEmail2FA} disabled={disablingEmail} className={cn(CY.btnDestructive, "px-3")} style={clipSm}>
                {disablingEmail && <Loader2 className="inline mr-1.5 h-3 w-3 animate-spin" />}
                {disablingEmail ? t("twoFactor.email2fa.disabling") : t("twoFactor.email2fa.disable")}
              </button>
            ) : (
              <button onClick={handleEnableEmail2FA} disabled={enablingEmail || showEmailConfirm} className={cn(CY.btnGhost, "px-3")} style={clipSm}>
                {enablingEmail && <Loader2 className="inline mr-1.5 h-3 w-3 animate-spin" />}
                {enablingEmail ? t("twoFactor.email2fa.enabling") : t("twoFactor.email2fa.enable")}
              </button>
            )}
          </div>

          {/* OTP confirm flow */}
          <AnimatePresence>
            {showEmailConfirm && !twoFactor.emailEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden border-t border-primary/10">
                <div className="px-4 py-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    <span className="text-[8px] font-mono text-primary/35 tracking-[0.25em] uppercase">Verification Code</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
                  </div>

                  <p className="text-[9px] text-primary/25 font-mono tracking-wider text-center">{t("twoFactor.email2fa.confirmDesc")}</p>

                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={emailConfirmCode} onChange={setEmailConfirmCode}>
                      <InputOTPGroup className="gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} className={cn("w-10 h-12 rounded-none font-mono text-base", "bg-[#010608] border-primary/20", "focus:border-primary/60", "text-primary/80 tracking-widest")} style={clipSm} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <button
                    onClick={handleConfirmEmail2FA}
                    disabled={confirmingEmail || emailConfirmCode.length < 6}
                    className={cn(
                      "w-full h-10 font-mono text-[10px] tracking-[0.25em] uppercase",
                      "bg-primary/8 border border-primary/25 text-primary",
                      "hover:bg-primary/14 hover:border-primary/50",
                      "disabled:opacity-25 disabled:cursor-not-allowed",
                      "transition-all duration-200 flex items-center justify-center gap-2",
                    )}
                    style={clipSm}
                  >
                    {confirmingEmail && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {confirmingEmail ? t("twoFactor.email2fa.confirming") : `[ ${t("twoFactor.email2fa.confirmButton")} ]`}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DataPanel>
  );
}
