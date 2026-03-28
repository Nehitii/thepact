import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Loader2, User, ShieldCheck, Lock, Eye, EyeOff, Smartphone, Check,
  AlertTriangle, Activity, Trash2, History, LogOut, Mail,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { cn } from "@/lib/utils";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { useQuery } from "@tanstack/react-query";
import {
  CyberPanel, CyberInput, CyberSelect, SettingsTabBar, StickyCommandBar,
} from "@/components/profile/settings-ui";

const TIMEZONES = [
  "UTC", "Europe/Paris", "Europe/London", "America/New_York", "America/Los_Angeles",
  "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney",
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

// ─── Cyber Birthday Picker ───
function CyberBirthdayPicker({ value, onChange, label }: { value: Date | undefined; onChange: (d: Date) => void; label: string }) {
  const dateLocale = useDateFnsLocale();
  const years = useMemo(() => { const cy = new Date().getFullYear(); return Array.from({ length: 100 }).map((_, i) => cy - i); }, []);
  const months = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({ value: i, label: format(new Date(2000, i, 1), "MMM", { locale: dateLocale }).toUpperCase() })), [dateLocale]);

  const [year, setYear] = useState<number | undefined>(value?.getFullYear());
  const [month, setMonth] = useState<number | undefined>(value?.getMonth());
  const [day, setDay] = useState<number | undefined>(value?.getDate());

  useEffect(() => { if (value) { setYear(value.getFullYear()); setMonth(value.getMonth()); setDay(value.getDate()); } }, [value]);

  const daysInMonth = year !== undefined && month !== undefined ? new Date(year, month + 1, 0).getDate() : 31;
  const days = useMemo(() => Array.from({ length: daysInMonth }).map((_, i) => i + 1), [daysInMonth]);

  const handleUpdate = (y?: number, m?: number, d?: number) => {
    let newY = y !== undefined ? y : year;
    let newM = m !== undefined ? m : month;
    let newD = d !== undefined ? d : day;
    if (newY !== undefined && newM !== undefined && newD !== undefined) {
      const max = new Date(newY, newM + 1, 0).getDate();
      if (newD > max) newD = max;
    }
    setYear(newY); setMonth(newM); setDay(newD);
    if (newY !== undefined && newM !== undefined && newD !== undefined) onChange(new Date(newY, newM, newD));
  };

  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase group-focus-within:text-primary transition-colors flex items-center gap-2">
        <span className="text-primary/40">{">"}</span> {label}
      </label>
      <div className="flex gap-2 w-full">
        <Select value={day?.toString()} onValueChange={(v) => handleUpdate(year, month, parseInt(v))}>
          <SelectTrigger className="bg-foreground/5 border-none border-b-2 border-foreground/10 rounded-none h-[68px] font-mono text-sm focus:ring-0 focus:border-primary text-foreground flex-1 transition-colors hover:bg-primary/5"><SelectValue placeholder="DD" /></SelectTrigger>
          <SelectContent className="bg-card border-primary/30 rounded-none font-mono">{days.map((d) => <SelectItem key={d} value={d.toString()}>{d.toString().padStart(2, "0")}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={month?.toString()} onValueChange={(v) => handleUpdate(year, parseInt(v), day)}>
          <SelectTrigger className="bg-foreground/5 border-none border-b-2 border-foreground/10 rounded-none h-[68px] font-mono text-sm focus:ring-0 focus:border-primary text-foreground flex-[1.2] transition-colors hover:bg-primary/5"><SelectValue placeholder="MM" /></SelectTrigger>
          <SelectContent className="bg-card border-primary/30 rounded-none font-mono max-h-[300px]">{months.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={year?.toString()} onValueChange={(v) => handleUpdate(parseInt(v), month, day)}>
          <SelectTrigger className="bg-foreground/5 border-none border-b-2 border-foreground/10 rounded-none h-[68px] font-mono text-sm focus:ring-0 focus:border-primary text-foreground flex-[1.5] transition-colors hover:bg-primary/5"><SelectValue placeholder="YYYY" /></SelectTrigger>
          <SelectContent className="bg-card border-primary/30 rounded-none font-mono max-h-[300px]">{years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Main Component ───
export function ProfileAccountSettings({ userId, initialData }: ProfileAccountSettingsProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState<"IDENTITY" | "SECURITY" | "SYSTEM">("IDENTITY");
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [latestLog, setLatestLog] = useState<{ text: string; type: "ok" | "warn" | "info" }>({ text: "SYSTEM.READY // AWAITING INPUT", type: "info" });

  const addLog = (text: string, type: "ok" | "warn" | "info") => setLatestLog({ text, type });

  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(isChanged);
    if (isChanged && latestLog.text.includes("SYSTEM.READY")) addLog("UNSAVED MODIFICATIONS DETECTED", "warn");
  }, [formData, initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    addLog("COMMITTING CHANGES TO MAINFRAME...", "info");
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: formData.displayName.trim() || null,
        timezone: formData.timezone, language: formData.language, currency: formData.currency,
        birthday: formData.birthday ? format(formData.birthday, "yyyy-MM-dd") : null,
        country: formData.country || null,
      }).eq("id", userId);
      if (error) throw error;
      if (formData.language !== i18n.language) await i18n.changeLanguage(formData.language);
      updateGlobalCurrency(formData.currency);
      await refreshCurrency();
      setHasChanges(false);
      addLog("UPDATE SUCCESSFUL. DATA SYNCED.", "ok");
      toast({ title: t("profile.updatedTitle"), description: t("profile.updatedDesc") });
    } catch (error: any) {
      addLog(`COMMIT ERROR: ${error.message.toUpperCase()}`, "warn");
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-32">
      <SettingsTabBar tabs={["IDENTITY", "SECURITY", "SYSTEM"] as const} activeTab={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-8">
          {activeTab === "IDENTITY" && (
            <>
              <CyberPanel title="Core Identity">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <CyberInput label={t("common.email")} value={formData.email} disabled />
                    <Lock className="absolute right-4 top-[40px] h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <CyberInput label={t("profile.displayName")} placeholder="Enter Alias" value={formData.displayName} onChange={(e: any) => setFormData((p) => ({ ...p, displayName: e.target.value }))} />
                  <CyberBirthdayPicker label={t("profile.birthday")} value={formData.birthday} onChange={(d) => setFormData((p) => ({ ...p, birthday: d }))} />
                </div>
              </CyberPanel>

              <CyberPanel title="Localization Config">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CyberSelect label={t("profile.country")} value={formData.country} onValueChange={(v) => setFormData((p) => ({ ...p, country: v }))}>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{t(`profile.countries.${c}`)}</SelectItem>)}
                  </CyberSelect>
                  <CyberSelect label={t("profile.timezone")} value={formData.timezone} onValueChange={(v) => setFormData((p) => ({ ...p, timezone: v }))}>
                    {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </CyberSelect>
                  <CyberSelect label={t("profile.language")} value={formData.language} onValueChange={(v) => setFormData((p) => ({ ...p, language: v }))}>
                    <SelectItem value="en">ENGLISH</SelectItem>
                    <SelectItem value="fr">FRANÇAIS</SelectItem>
                  </CyberSelect>
                  <CyberSelect label={t("profile.currency")} value={formData.currency} onValueChange={(v) => setFormData((p) => ({ ...p, currency: v }))}>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="usd">USD ($)</SelectItem>
                  </CyberSelect>
                </div>
              </CyberPanel>
            </>
          )}

          {activeTab === "SECURITY" && (
            <>
              <ChangePasswordSection onLog={addLog} />
              <TwoFactorSection onLog={addLog} />
            </>
          )}

          {activeTab === "SYSTEM" && (
            <>
              <SessionsSection userId={userId} onLog={addLog} />
              <DangerZoneSection onLog={addLog} />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <StickyCommandBar latestLog={latestLog} hasChanges={hasChanges} isSaving={isSaving} onSave={handleSave} />
    </div>
  );
}

// ─── Sub-Components ──────────────────────────
function ChangePasswordSection({ onLog }: { onLog: (text: string, type: "ok" | "warn" | "info") => void }) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mismatch = !!confirmPassword && newPassword !== confirmPassword;

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return toast({ title: "ERROR", description: "MIN 6 CHARACTERS REQUIRED", variant: "destructive" });
    if (mismatch) return toast({ title: "ERROR", description: "PASSWORDS DO NOT MATCH", variant: "destructive" });
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword(""); setConfirmPassword("");
      onLog("ENCRYPTION KEY UPDATED", "ok");
      toast({ title: "SUCCESS", description: "Password updated successfully." });
    } catch (error: any) {
      onLog("KEY UPDATE FAILED", "warn");
      toast({ title: "ERROR", description: error.message, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  return (
    <CyberPanel title="Security Credentials">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <CyberInput label="New Password" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="••••••••" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[40px] text-muted-foreground/50 hover:text-primary">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="relative">
          <CyberInput label="Confirm Password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={mismatch ? "border-destructive focus-visible:border-destructive" : ""} />
        </div>
      </div>
      <button onClick={handleChangePassword} disabled={isSaving || !newPassword || mismatch} className="mt-4 px-6 py-4 bg-foreground/5 hover:bg-primary/20 border border-primary/30 text-primary font-mono text-[10px] tracking-[0.2em] uppercase transition-colors disabled:opacity-30" style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
        {isSaving ? "PROCESSING..." : "[ INITIALIZE KEY CHANGE ]"}
      </button>
    </CyberPanel>
  );
}

function TwoFactorSection({ onLog }: { onLog: (text: string, type: "ok" | "warn" | "info") => void }) {
  const navigate = useNavigate();
  const twoFactor = useTwoFactor();

  const StatusTag = ({ active }: { active: boolean }) => (
    <span className={cn("px-2 py-1 text-[9px] font-mono tracking-widest uppercase border", active ? "bg-primary/10 border-primary/40 text-primary" : "bg-foreground/5 border-foreground/10 text-muted-foreground")}>{active ? "ACTIVE" : "OFFLINE"}</span>
  );

  return (
    <CyberPanel title="Multi-Factor Auth">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card/40 border border-foreground/10">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <Smartphone className="w-5 h-5 text-primary/70" />
            <div><p className="font-mono text-xs text-foreground/80">Authenticator App</p><p className="font-mono text-[10px] text-muted-foreground mt-1">TOTP Protocol Encryption</p></div>
            <StatusTag active={twoFactor.enabled} />
          </div>
          <button onClick={() => navigate("/profile")} className="text-[10px] font-mono text-primary hover:underline uppercase tracking-widest">{">"} CONFIG</button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card/40 border border-foreground/10">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <Mail className="w-5 h-5 text-primary/70" />
            <div><p className="font-mono text-xs text-foreground/80">Email Verification</p><p className="font-mono text-[10px] text-muted-foreground mt-1">Fallback Security Layer</p></div>
            <StatusTag active={twoFactor.emailEnabled} />
          </div>
          <button disabled className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{">"} LOCKED (CLI ONLY)</button>
        </div>
      </div>
    </CyberPanel>
  );
}

function SessionsSection({ userId, onLog }: { userId: string; onLog: (text: string, type: "ok" | "warn" | "info") => void }) {
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const { data: loginHistory } = useQuery({
    queryKey: ["security-events", userId],
    queryFn: async () => {
      const { data } = await supabase.from("security_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!userId,
  });

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: "others" as any });
      onLog("SESSIONS TERMINATED", "ok");
      toast({ title: "Terminated", description: "All other sessions disconnected." });
    } finally { setSigningOut(false); }
  };

  return (
    <CyberPanel title="Active Connections">
      <div className="space-y-6">
        <button onClick={handleSignOutAll} disabled={signingOut} className="w-full flex items-center justify-center gap-3 p-4 border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 text-foreground/80 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors">
          <LogOut className="w-4 h-4" /> {signingOut ? "TERMINATING..." : "KILL ALL OTHER SESSIONS"}
        </button>
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase border-b border-foreground/5 pb-2">Connection Logs</p>
          {!loginHistory?.length ? (
            <p className="text-xs text-muted-foreground/40 font-mono py-4">NO RECENT ACTIVITY DETECTED.</p>
          ) : (
            <div className="space-y-1">
              {loginHistory.map((ev: any) => (
                <div key={ev.id} className="flex justify-between items-center py-2 text-[10px] font-mono border-b border-foreground/5 last:border-0">
                  <span className="text-primary/60">{ev.event_type}</span>
                  <span className="text-muted-foreground/50">{new Date(ev.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CyberPanel>
  );
}

function DangerZoneSection({ onLog }: { onLog: (text: string, type: "ok" | "warn" | "info") => void }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    try {
      await supabase.functions.invoke("delete-account", { headers: { Authorization: `Bearer ${session?.access_token}` } });
      onLog("ACCOUNT PURGED", "warn");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (e: any) {
      onLog("PURGE FAILED", "warn");
    }
  };

  return (
    <>
      <CyberPanel title="Danger Zone" accent="red">
        <div className="bg-destructive/10 border border-destructive/30 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h4 className="font-orbitron text-destructive text-sm tracking-widest mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> PURGE ACCOUNT</h4>
            <p className="font-mono text-[10px] text-destructive/60 uppercase">This action will permanently destroy all data. No recovery.</p>
          </div>
          <button onClick={() => setShowDeleteModal(true)} className="px-6 py-3 bg-destructive/20 hover:bg-destructive/40 text-destructive font-mono text-[10px] tracking-[0.2em] font-bold uppercase transition-colors" style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
            INITIATE PURGE
          </button>
        </div>
      </CyberPanel>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-card border-destructive/50 rounded-none">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-destructive">SYSTEM PURGE WARNING</DialogTitle>
            <DialogDescription className="font-mono text-destructive/60 text-xs">Type "DELETE" to confirm destruction.</DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="bg-destructive/5 border-destructive/30 text-destructive font-mono rounded-none focus-visible:ring-destructive" />
          <DialogFooter>
            <button onClick={handleDelete} disabled={deleteConfirm !== "DELETE"} className="bg-destructive text-destructive-foreground font-mono text-xs px-6 py-2 uppercase tracking-widest disabled:opacity-30">CONFIRM PURGE</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
