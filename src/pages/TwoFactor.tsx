import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { useMfa } from "@/hooks/useMfa";
import { Smartphone, Loader2 } from "lucide-react";
import { DSPageShell } from "@/components/ds";

type FromState = { from?: string };

/**
 * Verification du second facteur sur une session existante.
 *
 * Un code valide fait reemettre le JWT avec `aal2`. C'est cette
 * revendication que les politiques RLS exigent : sortir de cet ecran sans
 * l'obtenir ne donne acces a rien.
 */
export default function TwoFactor() {
  const navigate = useNavigate();
  const location = useLocation();
  const mfa = useMfa();

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const from = useMemo(() => {
    const state = (location.state ?? {}) as FromState;
    const candidate = typeof state.from === "string" ? state.from : "";
    // N'accepter qu'un chemin interne. "//host" et "/\host" sont traites comme
    // des URL protocole-relatives par le routeur et sortiraient du site
    // (CVE-2025-68470 et son contournement par antislash).
    const isInternal = /^\/(?![/\\])/.test(candidate);
    return isInternal ? candidate : "/";
  }, [location.state]);

  // Si le second facteur n'est plus attendu, ne pas retenir l'utilisateur ici.
  useEffect(() => {
    if (!mfa.isLoading && !mfa.isRequired) navigate(from, { replace: true });
  }, [from, navigate, mfa.isLoading, mfa.isRequired]);

  const submit = useCallback(async () => {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      await mfa.verify(code);
      toast.success("Identite confirmee");
      navigate(from, { replace: true });
    } catch (e: any) {
      toast.error("Code refuse", { description: e?.message });
      setCode("");
    } finally {
      setBusy(false);
    }
  }, [code, from, mfa, navigate]);

  // Validation automatique des que les six chiffres sont saisis.
  useEffect(() => {
    if (code.length === 6 && !busy) void submit();
  }, [code, busy, submit]);

  if (mfa.isLoading) {
    return (
      <DSPageShell>
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DSPageShell>
    );
  }

  return (
    <DSPageShell>
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-mono uppercase tracking-widest text-sm">
              Verification requise
            </CardTitle>
            <CardDescription className="font-mono ds-t-label">
              Saisis le code a six chiffres affiche par ton application d'authentification.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy} autoFocus>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={submit}
              disabled={busy || code.length !== 6}
              className="w-full font-mono ds-t-label uppercase tracking-widest"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
            </Button>

            <p className="text-center font-mono ds-t-label leading-relaxed text-muted-foreground">
              Appareil perdu&nbsp;? Le facteur se supprime depuis le tableau de bord Supabase,
              rubrique Authentication → Users. C'est le seul recours&nbsp;: aucun code de
              secours n'est conserve par l'application.
            </p>
          </CardContent>
        </Card>
      </div>
    </DSPageShell>
  );
}
