import { useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "react-i18next";

type FromState = {
  from?: string;
};

function guessDeviceLabel() {
  try {
    const ua = navigator.userAgent;
    // Keep it short; server also truncates.
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

  const from = useMemo(() => {
    const state = (location.state ?? {}) as FromState;
    return state.from && typeof state.from === "string" ? state.from : "/";
  }, [location.state]);

  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [otp, setOtp] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);

  // If 2FA isn't required, don't keep the user here.
  useEffect(() => {
    if (!twoFactor.isLoading && !twoFactor.isRequired) {
      navigate(from, { replace: true });
    }
  }, [from, navigate, twoFactor.isLoading, twoFactor.isRequired]);

  const handleVerify = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const payload: any = {
        action: "verify",
        trustDevice,
        deviceLabel: trustDevice ? guessDeviceLabel() : undefined,
      };

      if (mode === "totp") {
        payload.code = otp;
      } else {
        payload.recoveryCode = recoveryCode;
      }

      const { data, error } = await supabase.functions.invoke("two-factor", { body: payload });
      if (error) throw error;

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary">
      <Card className="w-full max-w-md border-2 shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">{t("twoFactor.title")}</CardTitle>
          <CardDescription>
            {t("twoFactor.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Use recovery code</p>
              <p className="text-xs text-muted-foreground">{t("twoFactor.recoveryHint")}</p>
            </div>
            <Switch
              checked={mode === "recovery"}
              onCheckedChange={(checked) => setMode(checked ? "recovery" : "totp")}
            />
          </div>

          {mode === "totp" ? (
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
          ) : (
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

          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t("twoFactor.trustDevice")}</p>
              <p className="text-xs text-muted-foreground">{t("twoFactor.trustHint")}</p>
            </div>
            <Switch checked={trustDevice} onCheckedChange={setTrustDevice} />
          </div>

          <Button className="w-full" onClick={handleVerify} disabled={loading}>
            {loading ? t("twoFactor.verifying") : t("twoFactor.verify")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
