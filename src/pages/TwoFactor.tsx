import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { setTrustedDeviceToken, useTwoFactor } from "@/hooks/useTwoFactor";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Mail, Smartphone, KeyRound, Loader2 } from "lucide-react";

type FromState = {
  from?: string;
};

type VerifyMode = "totp" | "email" | "recovery";

function guessDeviceLabel() {
  try {
    const ua = navigator.userAgent;
    return ua.length > 120 ? ua.slice(0, 120) : ua;
  } catch {
    return "Device";
  }
}

export default function TwoFactor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const twoFactor = useTwoFactor();
  const { session } = useAuth();

  const from = useMemo(() => {
    const state = (location.state ?? {}) as FromState;
    return state.from && typeof state.from === "string" ? state.from : "/";
  }, [location.state]);

  // Determine default mode based on what's enabled
  const defaultMode: VerifyMode = useMemo(() => {
    if (twoFactor.enabled) return "totp";
    if (twoFactor.emailEnabled) return "email";
    return "totp";
  }, [twoFactor.enabled, twoFactor.emailEnabled]);

  const [mode, setMode] = useState<VerifyMode>(defaultMode);
  const [otp, setOtp] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Update mode when 2FA status loads
  useEffect(() => {
    if (!twoFactor.isLoading) {
      if (twoFactor.enabled) setMode("totp");
      else if (twoFactor.emailEnabled) setMode("email");
    }
  }, [twoFactor.isLoading, twoFactor.enabled, twoFactor.emailEnabled]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // If 2FA isn't required, don't keep the user here.
  useEffect(() => {
    if (!twoFactor.isLoading && !twoFactor.isRequired) {
      navigate(from, { replace: true });
    }
  }, [from, navigate, twoFactor.isLoading, twoFactor.isRequired]);

  const invokeWithRetry = useCallback(async (payload: any) => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      await supabase.auth.signOut();
      return null;
    }

    const invoke = async (token: string) => {
      return await supabase.functions.invoke("two-factor", {
        body: payload,
        headers: { Authorization: `Bearer ${token}` },
      });
    };

    const is401 = (err: unknown) => {
      const anyErr = err as any;
      const status = anyErr?.context?.status ?? anyErr?.status;
      const msg = typeof anyErr?.message === "string" ? anyErr.message : "";
      return status === 401 || /invalid or expired token/i.test(msg);
    };

    let { data, error } = await invoke(accessToken);
    if (error && is401(error)) {
      const refreshed = await supabase.auth.refreshSession();
      const newToken = refreshed.data.session?.access_token;
      if (newToken) ({ data, error } = await invoke(newToken));
    }
    if (error && is401(error)) {
      await supabase.auth.signOut();
      return null;
    }
    if (error) throw error;
    return data;
  }, [session]);

  const handleSendEmailCode = async () => {
    if (sendingEmail || cooldown > 0) return;
    setSendingEmail(true);
    try {
      await invokeWithRetry({ action: "send_email_code" });
      setEmailSent(true);
      setCooldown(60);
      toast({ title: t("twoFactor.emailSentTitle"), description: t("twoFactor.emailSentDesc") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e?.message || "Failed to send code", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleVerify = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const payload: any = {
        action: "verify",
        trustDevice,
        deviceLabel: trustDevice ? guessDeviceLabel() : undefined,
      };

      if (mode === "totp") payload.code = otp;
      else if (mode === "email") payload.emailCode = emailCode;
      else payload.recoveryCode = recoveryCode;

      const data = await invokeWithRetry(payload);
      if (!data) return;

      if (data?.deviceToken) {
        setTrustedDeviceToken(String(data.deviceToken));
      }

      twoFactor.setSessionVerified(true);
      toast({ title: t("twoFactor.verifiedTitle"), description: t("twoFactor.verifiedDesc") });
      navigate(from, { replace: true });
    } catch (e: any) {
      toast({
        title: t("twoFactor.failedTitle"),
        description: e?.message || t("twoFactor.failedDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableModes: { key: VerifyMode; icon: any; label: string }[] = [];
  if (twoFactor.enabled) availableModes.push({ key: "totp", icon: Smartphone, label: t("twoFactor.modeTotp") });
  if (twoFactor.emailEnabled) availableModes.push({ key: "email", icon: Mail, label: t("twoFactor.modeEmail") });
  availableModes.push({ key: "recovery", icon: KeyRound, label: t("twoFactor.modeRecovery") });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary">
      <Card className="w-full max-w-md border-2 shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">{t("twoFactor.title")}</CardTitle>
          <CardDescription>{t("twoFactor.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Mode selector */}
          {availableModes.length > 1 && (
            <div className="flex gap-2">
              {availableModes.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    mode === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* TOTP mode */}
          {mode === "totp" && (
            <div className="space-y-3">
              <Label>{t("twoFactor.authenticatorCode")}</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
              <p className="text-xs text-muted-foreground text-center">{t("twoFactor.otpHint")}</p>
            </div>
          )}

          {/* Email mode */}
          {mode === "email" && (
            <div className="space-y-3">
              {!emailSent ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">{t("twoFactor.emailPrompt")}</p>
                  <Button onClick={handleSendEmailCode} disabled={sendingEmail} className="w-full">
                    {sendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    {sendingEmail ? t("twoFactor.sendingCode") : t("twoFactor.sendCode")}
                  </Button>
                </div>
              ) : (
                <>
                  <Label>{t("twoFactor.emailCodeLabel")}</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={emailCode} onChange={setEmailCode}>
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
                  <p className="text-xs text-muted-foreground text-center">{t("twoFactor.emailCodeHint")}</p>
                  <button
                    onClick={handleSendEmailCode}
                    disabled={cooldown > 0 || sendingEmail}
                    className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline w-full text-center block"
                  >
                    {cooldown > 0
                      ? t("twoFactor.resendIn", { seconds: cooldown })
                      : t("twoFactor.resendCode")}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Recovery mode */}
          {mode === "recovery" && (
            <div className="space-y-2">
              <Label htmlFor="recovery">{t("twoFactor.recoveryCode")}</Label>
              <Input
                id="recovery"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder={t("twoFactor.recoveryPlaceholder")}
                autoCapitalize="characters"
                autoComplete="one-time-code"
              />
            </div>
          )}

          {/* Trust device toggle */}
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t("twoFactor.trustDevice")}</p>
              <p className="text-xs text-muted-foreground">{t("twoFactor.trustHint")}</p>
            </div>
            <Switch checked={trustDevice} onCheckedChange={setTrustDevice} />
          </div>

          {/* Verify button (hidden when email mode hasn't sent yet) */}
          {!(mode === "email" && !emailSent) && (
            <Button className="w-full" onClick={handleVerify} disabled={loading}>
              {loading ? t("twoFactor.verifying") : t("twoFactor.verify")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
